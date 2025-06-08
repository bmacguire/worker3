import { Vector } from "./vector";

export class Face {
  vertices: [Vector, Vector, Vector];
  private _normal: Vector | undefined;

  constructor(v1: Vector, v2: Vector, v3: Vector, normal?: Vector) {
    this.vertices = [v1, v2, v3];
    this._normal = normal;
  }

  get normal() {
    if (!this._normal) {
      this._normal = this.vertices[1]
        .sub(this.vertices[0])
        .cross(this.vertices[2].sub(this.vertices[0]));
    }

    return this._normal;
  }

  get visible() {
    return this.normal.dot(this.vertices[0]) < 0;
  }
}
