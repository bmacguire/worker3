import { Vector } from "./vector";

export type Matrix = [
  [number, number, number],
  [number, number, number],
  [number, number, number]
];

export function buildRotation(unitVector: Vector, angle: number): Matrix {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const cf = 1 - c;
  const xy = unitVector.x * unitVector.y;
  const xz = unitVector.x * unitVector.z;
  const yz = unitVector.y * unitVector.z;

  return [
    [
      c + unitVector.x * unitVector.x * cf,
      xy * cf - unitVector.z * s,
      xz * cf + unitVector.y * s,
    ],
    [
      xy * cf + unitVector.z * s,
      c + unitVector.y * unitVector.y * cf,
      yz * cf - unitVector.x * s,
    ],
    [
      xz * cf - unitVector.y * s,
      yz * cf + unitVector.x * s,
      c + unitVector.z * unitVector.z * cf,
    ],
  ];
}

export function multiplyMatrices(...matrices: Matrix[]) {
  return matrices.reduce((p, m) => {
    const x: Matrix = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) {
          x[i][j] += p[i][k] * m[k][j];
        }
      }
    }

    return x;
  });
}

export function transposeMatrix(matrix: Matrix): Matrix {
  return [
    [matrix[0][0], matrix[1][0], matrix[2][0]],
    [matrix[0][1], matrix[1][1], matrix[2][1]],
    [matrix[0][2], matrix[1][2], matrix[2][2]],
  ];
}
