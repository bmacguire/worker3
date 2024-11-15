import { Vector } from "./vector";
import { Plane } from "./plane";

export class Face {
  readonly vertices: [Vector, Vector, Vector];
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

  get averageZ() {
    return (this.vertices[0].z + this.vertices[1].z + this.vertices[2].z) / 3;
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

  clip(plane: Plane) {
    const distances = this.vertices.map((v) => {
      return v.sub(plane.position).dot(plane.normal);
    });

    if (distances.every((d) => d <= 0)) {
      return [] as Face[];
    }

    if (distances.every((d) => d >= 0)) {
      return [this];
    }

    const insideIndices = distances
      .map((d, i) => (d > 0 ? i : undefined))
      .filter((i) => i !== undefined);

    if (insideIndices.length === 1) {
      const i0 = insideIndices[0];
      const i1 = (i0 + 1) % 3;
      const i2 = (i0 + 2) % 3;

      const t0 =
        plane.position.sub(this.vertices[i0]).dot(plane.normal) /
        this.vertices[i1].sub(this.vertices[i0]).dot(plane.normal);

      const t1 =
        plane.position.sub(this.vertices[i2]).dot(plane.normal) /
        this.vertices[i0].sub(this.vertices[i2]).dot(plane.normal);

      const q0 = this.vertices[i0]
        .scale(1 - t0)
        .sum(this.vertices[i1].scale(t0));

      const q1 = this.vertices[i2]
        .scale(1 - t1)
        .sum(this.vertices[i0].scale(t1));

      return [new Face(this.vertices[i0], q0, q1, this.normal)];
    }

    const i0 = distances.findIndex((d) => d < 0);
    const i1 = (i0 + 1) % 3;
    const i2 = (i0 + 2) % 3;

    const t0 =
      plane.position.sub(this.vertices[i0]).dot(plane.normal) /
      this.vertices[i1].sub(this.vertices[i0]).dot(plane.normal);

    const t1 =
      plane.position.sub(this.vertices[i2]).dot(plane.normal) /
      this.vertices[i0].sub(this.vertices[i2]).dot(plane.normal);

    const q0 = this.vertices[i0].scale(1 - t0).sum(this.vertices[i1].scale(t0));
    const q1 = this.vertices[i2].scale(1 - t1).sum(this.vertices[i0].scale(t1));

    return [
      new Face(this.vertices[i1], this.vertices[i2], q1, this.normal),
      new Face(q1, q0, this.vertices[i1], this.normal),
    ];
  }
}
