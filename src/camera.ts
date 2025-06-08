import { Vector } from "./vector";
import {
  Matrix,
  buildRotation,
  multiplyMatrices,
  transposeMatrix,
} from "./matrix";
import { Controller } from "./controller";

const TRANSLATION_SPEED = 0.03;
const ROTATION_SPEED = Math.PI / 512;
const BASIS = ["i", "j", "k"] as const;

export class Camera {
  position = new Vector(0, 0, 0);

  orientation = {
    i: Vector.i(),
    j: Vector.j(),
    k: Vector.k(),
  };

  rotation: Matrix = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];

  controller = new Controller();

  update() {
    const motions = this.controller.getMotions();

    const rotations = motions
      .filter((motion) => motion.type === "R")
      .map((motion) => {
        const rotation = buildRotation(
          this.orientation[motion.axis],
          motion.sign * ROTATION_SPEED
        );

        const i0 = BASIS.findIndex((axis) => axis === motion.axis);
        const i1 = (i0 + 1) % 3;
        const i2 = (i0 + 2) % 3;

        this.orientation[BASIS[i1]] =
          this.orientation[BASIS[i1]].transform(rotation);

        this.orientation[BASIS[i2]] = this.orientation[BASIS[i0]].cross(
          this.orientation[BASIS[i1]]
        );

        return rotation;
      });

    this.rotation = multiplyMatrices(...rotations, this.rotation);

    motions
      .filter((motion) => motion.type === "T")
      .forEach((motion) => {
        this.position = this.position.add(
          this.orientation[motion.axis].scale(motion.sign * TRANSLATION_SPEED)
        );
      });
  }

  transform(v: Vector) {
    return v.sub(this.position).transform(transposeMatrix(this.rotation));
  }
}
