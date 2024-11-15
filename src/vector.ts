import { Matrix } from "./matrix";

export class Vector {
  x: number;
  y: number;
  z: number;
  w: number;

  constructor(x: number, y: number, z: number, w = 1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  static get i() {
    return new Vector(1, 0, 0);
  }

  static get j() {
    return new Vector(0, 1, 0);
  }

  static get k() {
    return new Vector(0, 0, 1);
  }

  sum(vector: Vector) {
    return new Vector(this.x + vector.x, this.y + vector.y, this.z + vector.z);
  }

  sub(vector: Vector) {
    return new Vector(this.x - vector.x, this.y - vector.y, this.z - vector.z);
  }

  scale(k: number) {
    return new Vector(this.x * k, this.y * k, this.z * k);
  }

  dot(vector: Vector) {
    return this.x * vector.x + this.y * vector.y + this.z * vector.z;
  }

  cross(vector: Vector) {
    return new Vector(
      this.y * vector.z - this.z * vector.y,
      this.z * vector.x - this.x * vector.z,
      this.x * vector.y - this.y * vector.x
    );
  }

  transform(matrix: Matrix) {
    return new Vector(
      new Vector(...matrix[0]).dot(this),
      new Vector(...matrix[1]).dot(this),
      new Vector(...matrix[2]).dot(this)
    );
  }

  unit() {
    return this.scale(1 / Math.hypot(this.x, this.y, this.z));
  }
}

export enum AxisName {
  I = "i",
  J = "j",
  K = "k",
}
