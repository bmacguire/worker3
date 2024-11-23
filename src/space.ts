import { Camera } from "./camera";
import { Vector } from "./vector";
import { Face } from "./face";
import { clipMesh, Mesh, visibleMesh } from "./mesh";
import { Plane } from "./plane";

export class Space {
  screenWidth: number;
  screenHeight: number;
  halfViewWidth: number;
  halfViewHeight: number;
  aspectRatio: number;
  fov: number;
  fovFactor: number;
  zNear: number;
  zFar: number;
  zFactor: number;

  nearXYPlane: Plane;
  farXYPlane: Plane;
  topXZPlane: Plane;
  bottomXZPlane: Plane;
  leftYZPlane: Plane;
  rightYZPlane: Plane;

  context: CanvasRenderingContext2D;
  screenImageData: ImageData;
  zBuffer: number[];

  camera = new Camera();

  constructor(
    canvas: HTMLCanvasElement,
    fov: number,
    zNear: number,
    zFar: number
  ) {
    this.screenWidth = canvas.width;
    this.screenHeight = canvas.height;
    this.halfViewWidth = canvas.width * 0.5;
    this.halfViewHeight = canvas.height * 0.5;
    this.aspectRatio = canvas.height / canvas.width;
    this.fov = fov;
    this.fovFactor = 1 / Math.tan(fov * 0.5);
    this.zNear = zNear;
    this.zFar = zFar;
    this.zFactor = zFar / (zFar - zNear);

    this.nearXYPlane = {
      position: new Vector(0, 0, zNear),
      normal: Vector.k,
    };

    this.farXYPlane = {
      position: new Vector(0, 0, zFar),
      normal: Vector.k.scale(-1),
    };

    this.topXZPlane = {
      position: new Vector(1, 1, 0),
      normal: Vector.j,
    };

    this.bottomXZPlane = {
      position: new Vector(canvas.width - 2, canvas.height - 2, 0),
      normal: Vector.j.scale(-1),
    };

    this.leftYZPlane = {
      position: new Vector(1, 1, 0),
      normal: Vector.i,
    };

    this.rightYZPlane = {
      position: new Vector(canvas.width - 2, canvas.height - 2, 0),
      normal: Vector.i.scale(-1),
    };

    this.context = canvas.getContext("2d")!;
    this.screenImageData = new ImageData(canvas.width, canvas.height);
    this.zBuffer = new Array(canvas.width * canvas.height).fill(0);
  }

  clear() {
    for (let i = 0; i < this.screenImageData.data.length; i += 4) {
      this.screenImageData.data[i] = 0;
      this.screenImageData.data[i + 1] = 0;
      this.screenImageData.data[i + 2] = 0;
      this.screenImageData.data[i + 3] = 255;
    }

    this.zBuffer = new Array(this.screenWidth * this.screenHeight).fill(0);
  }

  fillScreenImageData(mesh: Mesh) {
    for (let fi = 0; fi < mesh.faces.length; fi++) {
      const f = mesh.faces[fi];
      const tf = mesh.tfaces[fi];

      let [[x1, y1, u1, v1, w1], [x2, y2, u2, v2, w2], [x3, y3, u3, v3, w3]] =
        f.vertices
          .map((v, vi) => [v, vi] as [Vector, number])
          .sort(([v1], [v2]) => v1.y - v2.y)
          .map(([v, vi]) => [
            Math.round(v.x),
            Math.round(v.y),
            tf.vertices[vi].x,
            tf.vertices[vi].y,
            tf.vertices[vi].z,
          ]);

      let dy1 = y2 - y1;
      let dx1 = x2 - x1;
      let dv1 = v2 - v1;
      let du1 = u2 - u1;
      let dw1 = w2 - w1;

      let dy2 = y3 - y1;
      let dx2 = x3 - x1;
      let dv2 = v3 - v1;
      let du2 = u3 - u1;
      let dw2 = w3 - w1;

      let tex_u = 0;
      let tex_v = 0;
      let tex_w = 0;

      let daxStep = 0;
      let dbxStep = 0;

      let du1_step = 0;
      let dv1_step = 0;
      let du2_step = 0;
      let dv2_step = 0;
      let dw1_step = 0;
      let dw2_step = 0;

      if (dy1 !== 0) {
        daxStep = dx1 / dy1;

        du1_step = du1 / dy1;
        dv1_step = dv1 / dy1;
        dw1_step = dw1 / dy1;
      }

      if (dy2 !== 0) {
        dbxStep = dx2 / dy2;

        du2_step = du2 / dy2;
        dv2_step = dv2 / dy2;
        dw2_step = dw2 / dy2;
      }

      if (dy1) {
        for (let i = y1; i <= y2; i++) {
          let ax = Math.round(x1 + (i - y1) * daxStep);
          let bx = Math.round(x1 + (i - y1) * dbxStep);

          let tex_su = u1 + (i - y1) * du1_step;
          let tex_sv = v1 + (i - y1) * dv1_step;
          let tex_sw = w1 + (i - y1) * dw1_step;

          let tex_eu = u1 + (i - y1) * du2_step;
          let tex_ev = v1 + (i - y1) * dv2_step;
          let tex_ew = w1 + (i - y1) * dw2_step;

          if (ax > bx) {
            [ax, bx] = [bx, ax];
            [tex_su, tex_eu] = [tex_eu, tex_su];
            [tex_sv, tex_ev] = [tex_ev, tex_sv];
            [tex_sw, tex_ew] = [tex_ew, tex_sw];
          }

          tex_u = tex_su;
          tex_v = tex_sv;
          tex_w = tex_sw;

          let tstep = 1 / (bx - ax);
          let t = 0;

          for (let j = ax; j <= bx; j++) {
            const zbi = i * this.screenImageData.width + j;

            tex_w = (1 - t) * tex_sw + t * tex_ew;

            if (tex_w > this.zBuffer[zbi]) {
              tex_u = (1 - t) * tex_su + t * tex_eu;
              tex_v = (1 - t) * tex_sv + t * tex_ev;

              const u = Math.round((tex_u * (mesh.texture.width - 1)) / tex_w);
              const v = Math.round((tex_v * (mesh.texture.height - 1)) / tex_w);

              const pixel = mesh.texture.pixels[v][u];

              const si = zbi * 4;

              this.screenImageData.data[si] = pixel[0];
              this.screenImageData.data[si + 1] = pixel[1];
              this.screenImageData.data[si + 2] = pixel[2];
              this.screenImageData.data[si + 3] = pixel[3];

              this.zBuffer[zbi] = tex_w;
            }

            t += tstep;
          }
        }
      }

      dy1 = y3 - y2;
      dx1 = x3 - x2;
      dv1 = v3 - v2;
      du1 = u3 - u2;
      dw1 = w3 - w2;

      du1_step = 0;
      dv1_step = 0;

      if (dy1 !== 0) {
        daxStep = dx1 / dy1;

        du1_step = du1 / dy1;
        dv1_step = dv1 / dy1;
        dw1_step = dw1 / dy1;
      }

      if (dy2 !== 0) {
        dbxStep = dx2 / dy2;
      }

      if (dy1) {
        for (let i = y2; i <= y3; i++) {
          let ax = Math.round(x2 + (i - y2) * daxStep);
          let bx = Math.round(x1 + (i - y1) * dbxStep);

          let tex_su = u2 + (i - y2) * du1_step;
          let tex_sv = v2 + (i - y2) * dv1_step;
          let tex_sw = w2 + (i - y2) * dw1_step;

          let tex_eu = u1 + (i - y1) * du2_step;
          let tex_ev = v1 + (i - y1) * dv2_step;
          let tex_ew = w1 + (i - y1) * dw2_step;

          if (ax > bx) {
            [ax, bx] = [bx, ax];
            [tex_su, tex_eu] = [tex_eu, tex_su];
            [tex_sv, tex_ev] = [tex_ev, tex_sv];
            [tex_sw, tex_ew] = [tex_ew, tex_sw];
          }

          tex_u = tex_su;
          tex_v = tex_sv;
          tex_w = tex_sw;

          let tstep = 1 / (bx - ax);
          let t = 0;

          for (let j = ax; j <= bx; j++) {
            const zbi = i * this.screenImageData.width + j;

            tex_w = (1 - t) * tex_sw + t * tex_ew;

            if (tex_w > this.zBuffer[zbi]) {
              tex_u = (1 - t) * tex_su + t * tex_eu;
              tex_v = (1 - t) * tex_sv + t * tex_ev;

              const u = Math.round((tex_u * (mesh.texture.width - 1)) / tex_w);
              const v = Math.round((tex_v * (mesh.texture.height - 1)) / tex_w);

              const pixel = mesh.texture.pixels[v][u];

              const si = zbi * 4;

              this.screenImageData.data[si] = pixel[0];
              this.screenImageData.data[si + 1] = pixel[1];
              this.screenImageData.data[si + 2] = pixel[2];
              this.screenImageData.data[si + 3] = pixel[3];

              this.zBuffer[zbi] = tex_w;
            }

            t += tstep;
          }
        }
      }
    }
  }

  render(mesh: Mesh) {
    const transformedFaces = mesh.faces.map((f) => {
      return new Face(
        this.camera.transform(f.vertices[0]),
        this.camera.transform(f.vertices[1]),
        this.camera.transform(f.vertices[2])
      );
    });

    let rmesh = new Mesh(transformedFaces, mesh.tfaces, mesh.texture);

    rmesh = visibleMesh(rmesh);

    rmesh = clipMesh(rmesh, this.nearXYPlane);
    rmesh = clipMesh(rmesh, this.farXYPlane);

    const projectedFaces: Face[] = [];
    const projectedTFaces: Face[] = [];

    for (let fi = 0; fi < rmesh.faces.length; fi++) {
      const f = rmesh.faces[fi];
      const tf = rmesh.tfaces[fi];

      const vs = new Array<Vector>(3);
      const tvs = new Array<Vector>(3);

      for (let i = 0; i < 3; i++) {
        vs[i] = new Vector(
          (f.vertices[i].x *
            this.aspectRatio *
            this.fovFactor *
            this.halfViewWidth) /
            f.vertices[i].z +
            this.halfViewWidth,
          (f.vertices[i].y * this.fovFactor * this.halfViewHeight) /
            f.vertices[i].z +
            this.halfViewHeight,
          (this.zFactor * (f.vertices[i].z - this.zNear)) / f.vertices[i].z,
          f.vertices[i].z
        );

        tvs[i] = new Vector(
          tf.vertices[i].x / f.vertices[i].z,
          tf.vertices[i].y / f.vertices[i].z,
          1 / f.vertices[i].z
        );
      }

      projectedFaces.push(new Face(vs[0], vs[1], vs[2], f.normal));
      projectedTFaces.push(new Face(tvs[0], tvs[1], tvs[2]));
    }

    rmesh = new Mesh(projectedFaces, projectedTFaces, mesh.texture);

    rmesh = clipMesh(rmesh, this.topXZPlane);
    rmesh = clipMesh(rmesh, this.bottomXZPlane);
    rmesh = clipMesh(rmesh, this.leftYZPlane);
    rmesh = clipMesh(rmesh, this.rightYZPlane);

    this.fillScreenImageData(rmesh);

    this.context.putImageData(this.screenImageData, 0, 0);
  }
}
