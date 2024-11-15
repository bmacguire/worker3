import { AxisName } from "./vector";

export enum MotionType {
  Translation = "Translation",
  Rotation = "Rotation",
}

type Motion = {
  type: MotionType;
  axisName: AxisName;
  sign: -1 | 1;
};

const MOTIONS = new Map<string, Motion>([
  ["a", { type: MotionType.Translation, axisName: AxisName.I, sign: -1 }],
  ["d", { type: MotionType.Translation, axisName: AxisName.I, sign: 1 }],
  ["e", { type: MotionType.Translation, axisName: AxisName.J, sign: -1 }],
  ["q", { type: MotionType.Translation, axisName: AxisName.J, sign: 1 }],
  ["s", { type: MotionType.Translation, axisName: AxisName.K, sign: -1 }],
  ["w", { type: MotionType.Translation, axisName: AxisName.K, sign: 1 }],
  ["k", { type: MotionType.Rotation, axisName: AxisName.I, sign: -1 }],
  ["i", { type: MotionType.Rotation, axisName: AxisName.I, sign: 1 }],
  ["j", { type: MotionType.Rotation, axisName: AxisName.J, sign: -1 }],
  ["l", { type: MotionType.Rotation, axisName: AxisName.J, sign: 1 }],
  ["u", { type: MotionType.Rotation, axisName: AxisName.K, sign: -1 }],
  ["o", { type: MotionType.Rotation, axisName: AxisName.K, sign: 1 }],
]);

function addMotion(motions: Motion[], key: string) {
  const motion = MOTIONS.get(key);

  if (!motion) {
    return;
  }

  const moving = motions.some((m) => {
    return m.type === motion.type && m.axisName === motion.axisName;
  });

  if (moving) {
    return;
  }

  motions.unshift(motion);
}

export class Controller {
  private readonly keys = new Set<string>();

  constructor() {
    addEventListener("keydown", (ev) => {
      this.keys.add(ev.key);
    });

    addEventListener("keyup", (ev) => {
      this.keys.delete(ev.key);
    });
  }

  getMotions() {
    return [...this.keys].reduceRight((motions, key) => {
      addMotion(motions, key);
      return motions;
    }, [] as Motion[]);
  }
}
