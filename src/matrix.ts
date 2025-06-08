import { Vector } from "./vector";
import { cos, sin } from "./math";

export type Matrix = [
  [number, number, number],
  [number, number, number],
  [number, number, number]
];

export function buildRotation(u: Vector, angle: number): Matrix {
  const c = cos(angle);
  const s = sin(angle);

  const cc = 1 - c;

  const xycc = u.x * u.y * cc;
  const xzcc = u.x * u.z * cc;
  const yzcc = u.y * u.z * cc;

  const zs = u.z * s;
  const ys = u.y * s;
  const xs = u.x * s;

  return [
    [c + u.x * u.x * cc, xycc - zs, xzcc + ys],
    [xycc + zs, c + u.y * u.y * cc, yzcc - xs],
    [xzcc - ys, yzcc + xs, c + u.z * u.z * cc],
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
