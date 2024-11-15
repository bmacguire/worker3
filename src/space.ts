import { Camera } from "./camera";
import { Vector } from "./vector";
import { Face } from "./face";
import { Mesh } from "./mesh";
import { Plane } from "./plane";

const light = new Vector(0, 1, 1).scale(Math.SQRT1_2);

export class Space {
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
  id: ImageData;
  private readonly context: CanvasRenderingContext2D;
  camera = new Camera();

  constructor(
    canvas: HTMLCanvasElement,
    fov: number,
    zNear: number,
    zFar: number
  ) {
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
      position: new Vector(canvas.width - 1, canvas.height - 1, 0),
      normal: Vector.j.scale(-1),
    };

    this.leftYZPlane = {
      position: new Vector(1, 1, 0),
      normal: Vector.i,
    };

    this.rightYZPlane = {
      position: new Vector(canvas.width - 1, canvas.height - 1, 0),
      normal: Vector.i.scale(-1),
    };

    this.context = canvas.getContext("2d")!;

    this.id = this.context.createImageData(canvas.width, canvas.height);
  }

  clear() {
    const len = this.context.canvas.width * this.context.canvas.height * 4;

    for (let i = 0; i < len; i += 4) {
      this.id.data[i] = 0;
      this.id.data[i + 1] = 0;
      this.id.data[i + 2] = 0;
      this.id.data[i + 3] = 255;
    }
  }

  private projectVector(vector: Vector) {
    return new Vector(
      (vector.x * this.aspectRatio * this.fovFactor * this.halfViewWidth) /
        vector.z +
        this.halfViewWidth,
      (vector.y * this.fovFactor * this.halfViewHeight) / vector.z +
        this.halfViewHeight,
      (this.zFactor * (vector.z - this.zNear)) / vector.z,
      vector.z
    );
  }

  private projectFace(face: Face) {
    return new Face(
      this.projectVector(face.vertices[0]),
      this.projectVector(face.vertices[1]),
      this.projectVector(face.vertices[2])
    );
  }

  private cameraTransformFace(face: Face) {
    return new Face(
      this.camera.transform(face.vertices[0]),
      this.camera.transform(face.vertices[1]),
      this.camera.transform(face.vertices[2])
    );
  }

  private renderPixelFace(color: number, face: Face) {
    let [[x1, y1], [x2, y2], [x3, y3]] = face.vertices
      .sort((v1, v2) => v1.y - v2.y)
      .map((v) => [Math.floor(v.x), Math.floor(v.y)]);

    let dy1 = y2 - y1;
    let dx1 = x2 - x1;

    let dy2 = y3 - y1;
    let dx2 = x3 - x1;

    let daxStep = 0;
    let dbxStep = 0;

    if (dy1 !== 0) {
      daxStep = dx1 / dy1;
    }

    if (dy2 !== 0) {
      dbxStep = dx2 / dy2;
    }

    if (dy1) {
      for (let i = y1; i <= y2; i++) {
        let ax = x1 + (i - y1) * daxStep;
        let bx = x1 + (i - y1) * dbxStep;

        if (ax > bx) {
          [ax, bx] = [bx, ax];
        }

        for (let j = ax; j <= bx; j++) {
          const index =
            (Math.floor(i) * this.context.canvas.width + Math.floor(j)) * 4;

          this.id.data[index] = color;
          this.id.data[index + 1] = color;
          this.id.data[index + 2] = color;
          this.id.data[index + 3] = 255;
        }
      }
    }

    dy1 = y3 - y2;
    dx1 = x3 - x2;

    if (dy1 !== 0) {
      daxStep = dx1 / dy1;
    }

    if (dy2 !== 0) {
      dbxStep = dx2 / dy2;
    }

    if (dy1) {
      for (let i = y2; i <= y3; i++) {
        let ax = x2 + (i - y2) * daxStep;
        let bx = x1 + (i - y1) * dbxStep;

        if (ax > bx) {
          [ax, bx] = [bx, ax];
        }

        for (let j = ax; j <= bx; j++) {
          const index =
            (Math.floor(i) * this.context.canvas.width + Math.floor(j)) * 4;

          this.id.data[index] = color;
          this.id.data[index + 1] = color;
          this.id.data[index + 2] = color;
          this.id.data[index + 3] = 255;
        }
      }
    }
  }

  render(mesh: Mesh) {
    mesh.faces
      .map((face) => this.cameraTransformFace(face))
      .filter((face) => face.visible)
      .flatMap((face) => face.clip(this.nearXYPlane))
      .flatMap((face) => face.clip(this.farXYPlane))
      .sort((f1, f2) => f2.averageZ - f1.averageZ)
      .map(
        (face) =>
          [
            Math.floor(face.normal.unit().dot(light) * -255),
            this.projectFace(face),
          ] as [number, Face]
      )
      .flatMap(([c, face]) =>
        face.clip(this.topXZPlane).map((f) => [c, f] as [number, Face])
      )
      .flatMap(([c, face]) =>
        face.clip(this.bottomXZPlane).map((f) => [c, f] as [number, Face])
      )
      .flatMap(([c, face]) =>
        face.clip(this.leftYZPlane).map((f) => [c, f] as [number, Face])
      )
      .flatMap(([c, face]) =>
        face.clip(this.rightYZPlane).map((f) => [c, f] as [number, Face])
      )
      .forEach(([c, face]) => {
        this.renderPixelFace(c, face);
      });

    this.context.putImageData(this.id, 0, 0);
  }
}
