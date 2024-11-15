import { Vector, AxisName } from "./vector";
import {
  Matrix,
  buildRotation,
  multiplyMatrices,
  transposeMatrix,
} from "./matrix";
import { Controller, MotionType } from "./controller";

const TRANSLATION_SPEED = 0.03;
const ROTATION_SPEED = Math.PI / 512;
const AXIS_NAMES = [AxisName.I, AxisName.J, AxisName.K];

export class Camera {
  private position = new Vector(0, 0, 0);

  private orientation = {
    [AxisName.I]: Vector.i,
    [AxisName.J]: Vector.j,
    [AxisName.K]: Vector.k,
  };

  private rotation: Matrix = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];

  private readonly controller = new Controller();

  update() {
    const motions = this.controller.getMotions();

    const rotations = motions
      .filter((motion) => motion.type === MotionType.Rotation)
      .map((motion) => {
        const rotation = buildRotation(
          this.orientation[motion.axisName],
          motion.sign * ROTATION_SPEED
        );

        const i0 = AXIS_NAMES.findIndex(
          (axisName) => axisName === motion.axisName
        );
        const i1 = (i0 + 1) % 3;
        const i2 = (i0 + 2) % 3;

        this.orientation[AXIS_NAMES[i1]] =
          this.orientation[AXIS_NAMES[i1]].transform(rotation);

        this.orientation[AXIS_NAMES[i2]] = this.orientation[
          AXIS_NAMES[i0]
        ].cross(this.orientation[AXIS_NAMES[i1]]);

        return rotation;
      });

    this.rotation = multiplyMatrices(...rotations, this.rotation);

    motions
      .filter((motion) => motion.type === MotionType.Translation)
      .forEach((motion) => {
        this.position = this.position.sum(
          this.orientation[motion.axisName].scale(
            motion.sign * TRANSLATION_SPEED
          )
        );
      });
  }

  transform(vector: Vector) {
    return vector.sub(this.position).transform(transposeMatrix(this.rotation));
  }
}
