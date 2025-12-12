import { Vector } from "./vector";

export class Face {
  vertices: [Vector, Vector, Vector];
  _visibility: number | undefined;

  constructor(v1: Vector, v2: Vector, v3: Vector, visibility?: number) {
    this.vertices = [v1, v2, v3];
    this._visibility = visibility;
  }

  get visibility() {
    if (this._visibility === undefined) {
      const normal = this.vertices[1]
        .sub(this.vertices[0])
        .cross(this.vertices[2].sub(this.vertices[0]));

      this._visibility =
        -255 * normal.normalize().dot(this.vertices[0].normalize());
    }

    return this._visibility;
  }
}
