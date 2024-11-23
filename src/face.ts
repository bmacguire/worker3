import { Vector } from "./vector";

export class Face {
  vertices: [Vector, Vector, Vector];
  private _normal: Vector | undefined;

  constructor(
    vertex1: Vector,
    vertex2: Vector,
    vertex3: Vector,
    normal?: Vector
  ) {
    this.vertices = [vertex1, vertex2, vertex3];
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

  get isVisible() {
    return this.normal.dot(this.vertices[0]) < 0;
  }
}
