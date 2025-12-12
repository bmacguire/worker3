import { Mesh } from "./mesh";
import { Screen } from "./screen";
import { Vector } from "./vector";
import { Face } from "./face";
import { tan } from "./math";

export class Projector {
  screen: Screen;
  xyk: number;
  zk: number;
  near: number;

  constructor(screen: Screen, fov: number, near: number, far: number) {
    this.screen = screen;
    this.xyk = screen.halfHeight / tan(fov / 2);
    this.zk = far / (far - near);
    this.near = near;
  }

  project(mesh: Mesh) {
    const gfaces: Face[] = [];
    const tfaces: Face[] = [];

    for (let fi = 0; fi < mesh.gfaces.length; fi++) {
      const gf = mesh.gfaces[fi];
      const tf = mesh.tfaces[fi];

      const gvertices = new Array<Vector>(3);
      const tvertices = new Array<Vector>(3);

      for (let vi = 0; vi < 3; vi++) {
        gvertices[vi] = new Vector(
          (gf.vertices[vi].x * this.xyk) / gf.vertices[vi].z +
            this.screen.halfWidth,

          (gf.vertices[vi].y * this.xyk) / gf.vertices[vi].z +
            this.screen.halfHeight,

          // not sure it's needed for now...
          0, //this.zk * (1 - this.near / gf.vertices[vi].z),

          // not sure it's needed for now...
          // save it for post calcs...
          gf.vertices[vi].z
        );

        tvertices[vi] = new Vector(
          tf.vertices[vi].x / gf.vertices[vi].z,
          tf.vertices[vi].y / gf.vertices[vi].z,
          1 / gf.vertices[vi].z
        );
      }

      gfaces.push(
        new Face(gvertices[0], gvertices[1], gvertices[2], gf.visibility)
      );

      tfaces.push(new Face(tvertices[0], tvertices[1], tvertices[2]));
    }

    return new Mesh(gfaces, tfaces, mesh.texture);
  }
}
