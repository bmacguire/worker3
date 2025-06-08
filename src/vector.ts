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

  static i(k = 1) {
    return new Vector(1, 0, 0).scale(k);
  }

  static j(k = 1) {
    return new Vector(0, 1, 0).scale(k);
  }

  static k(k = 1) {
    return new Vector(0, 0, 1).scale(k);
  }

  add(v: Vector) {
    return new Vector(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  sub(v: Vector) {
    return new Vector(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  scale(k: number) {
    return new Vector(this.x * k, this.y * k, this.z * k);
  }

  dot(v: Vector) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v: Vector) {
    return new Vector(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  transform(m: Matrix) {
    return new Vector(
      new Vector(...m[0]).dot(this),
      new Vector(...m[1]).dot(this),
      new Vector(...m[2]).dot(this)
    );
  }

  normalize() {
    return this.scale(1 / Math.hypot(this.x, this.y, this.z));
  }
}
