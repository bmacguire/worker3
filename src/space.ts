import { Screen } from './screen';
import { Projector } from './projector';
import { Camera } from './camera';
import { Vector } from './vector';
import { Face } from './face';
import { Mesh } from './mesh';
import { Plane } from './plane';
import { round } from './math';
import { Rasterizer } from './rasterizer';

type Planes = {
  near: Plane;
  far: Plane;
  top: Plane;
  bottom: Plane;
  left: Plane;
  right: Plane;
};

export class Space {
  camera = new Camera();
  screen: Screen;
  planes: Planes;
  projector: Projector;
  rasterizer: Rasterizer;

  constructor(canvas: OffscreenCanvas, fov: number, near: number, far: number) {
    this.screen = new Screen(canvas);
    this.projector = new Projector(this.screen, fov, near, far);
    this.rasterizer = new Rasterizer(this.screen);
    this.planes = {
      near: {
        position: new Vector(0, 0, near),
        normal: Vector.k(),
      },
      far: {
        position: new Vector(0, 0, far),
        normal: Vector.k(-1),
      },
      top: {
        position: new Vector(1, 1, 0),
        normal: Vector.j(),
      },
      bottom: {
        position: new Vector(this.screen.width - 2, this.screen.height - 2, 0),
        normal: Vector.j(-1),
      },
      left: {
        position: new Vector(1, 1, 0),
        normal: Vector.i(),
      },
      right: {
        position: new Vector(this.screen.width - 2, this.screen.height - 2, 0),
        normal: Vector.i(-1),
      },
    };
  }

  transform(mesh: Mesh) {
    const gfaces = mesh.gfaces.map((gf) => {
      return new Face(
        this.camera.transform(gf.vertices[0]),
        this.camera.transform(gf.vertices[1]),
        this.camera.transform(gf.vertices[2]),
      );
    });

    return new Mesh(gfaces, mesh.tfaces, mesh.texture);
  }

  rasterize(mesh: Mesh) {
    this.rasterizer.rasterize(mesh);
  }

  render(...meshes: Mesh[]) {
    this.screen.clearPixels();

    for (const mesh of meshes) {
      let m = this.transform(mesh);

      m = m.asVisible().clip(this.planes.near).clip(this.planes.far);

      m = this.projector
        .project(m)
        .clip(this.planes.top)
        .clip(this.planes.bottom)
        .clip(this.planes.left)
        .clip(this.planes.right);

      this.rasterize(m);
    }

    this.screen.renderPixels();
  }
}
