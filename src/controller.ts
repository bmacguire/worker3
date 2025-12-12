type Motion = {
  type: "T" | "R";
  axis: "i" | "j" | "k";
  sign: -1 | 1;
};

const MOTIONS = new Map<string, Motion>([
  ["a", { type: "T", axis: "i", sign: -1 }],
  ["d", { type: "T", axis: "i", sign: 1 }],
  ["e", { type: "T", axis: "j", sign: -1 }],
  ["q", { type: "T", axis: "j", sign: 1 }],
  ["s", { type: "T", axis: "k", sign: -1 }],
  ["w", { type: "T", axis: "k", sign: 1 }],
  ["k", { type: "R", axis: "i", sign: -1 }],
  ["i", { type: "R", axis: "i", sign: 1 }],
  ["j", { type: "R", axis: "j", sign: -1 }],
  ["l", { type: "R", axis: "j", sign: 1 }],
  ["u", { type: "R", axis: "k", sign: -1 }],
  ["o", { type: "R", axis: "k", sign: 1 }],
]);

function addMotion(motions: Motion[], key: string) {
  const motion = MOTIONS.get(key);

  if (!motion) {
    return;
  }

  const moving = motions.some((m) => {
    return m.type === motion.type && m.axis === motion.axis;
  });

  if (!moving) {
    motions.unshift(motion);
  }
}

export class Controller {
  keys = new Set<string>();

  constructor() {
    addEventListener("keydown", (ev) => this.keys.add(ev.key));
    addEventListener("keyup", (ev) => this.keys.delete(ev.key));
  }

  getMotions() {
    return [...this.keys].reduceRight((motions, key) => {
      addMotion(motions, key);
      return motions;
    }, [] as Motion[]);
  }
}
