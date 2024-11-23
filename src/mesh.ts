import { Vector } from "./vector";
import { Face } from "./face";
import { Texture } from "./texture";
import { Plane } from "./plane";

export class Mesh {
  faces: Face[];
  tfaces: Face[];
  texture: Texture;

  constructor(faces: Face[], tfaces: Face[], texture: Texture) {
    this.faces = faces;
    this.tfaces = tfaces;
    this.texture = texture;
  }
}

export async function buildMesh(objBlob: Blob, texture: Texture) {
  try {
    const vertices: Vector[] = [];
    const tvertices: Vector[] = [];
    const faces: Face[] = [];
    const tfaces: Face[] = [];

    const content = await objBlob.text();
    const lines = content.split(/\r?\n/gm);

    for (const line of lines) {
      const parts = line
        .trim()
        .split(" ")
        .map((part) => part.trim());

      const type = parts.shift() ?? "";

      if (!["v", "vt", "f"].includes(type)) {
        continue;
      }

      if (type === "v") {
        const numbers = parts.map(parseFloat).filter((n) => !Number.isNaN(n));

        if (numbers.length < 3) {
          continue;
        }

        vertices.push(new Vector(numbers[0], numbers[1], numbers[2]));

        continue;
      }

      if (type === "vt") {
        const numbers = parts.map(parseFloat).filter((n) => !Number.isNaN(n));

        if (numbers.length < 2) {
          continue;
        }

        tvertices.push(new Vector(numbers[0], numbers[1], 0));

        continue;
      }

      if (parts.length < 3) {
        continue;
      }

      const [vi0, tvi0] = parts[0].split("/").map((x) => parseInt(x.trim()));
      const [vi1, tvi1] = parts[1].split("/").map((x) => parseInt(x.trim()));
      const [vi2, tvi2] = parts[2].split("/").map((x) => parseInt(x.trim()));

      const faceHasError = [vi0, vi1, vi2].some((vi) => {
        return !vertices[vi - 1];
      });

      if (faceHasError) {
        continue;
      }

      faces.push(
        new Face(vertices[vi0 - 1], vertices[vi1 - 1], vertices[vi2 - 1])
      );

      const tfaceHasError = [tvi0, tvi1, tvi2].some((tvi) => {
        return !tvertices[tvi - 1];
      });

      if (tfaceHasError) {
        continue;
      }

      tfaces.push(
        new Face(tvertices[tvi0 - 1], tvertices[tvi1 - 1], tvertices[tvi2 - 1])
      );
    }

    // if (faces.length !== tfaces.length || faces.length === 0) {
    //   throw Error("Invalid OBJ file");
    // }

    return new Mesh(faces, tfaces, texture);
  } catch (exception) {
    throw exception;
  }
}

export function visibleMesh(mesh: Mesh) {
  const faces: Face[] = [];
  const tfaces: Face[] = [];

  for (let fi = 0; fi < mesh.faces.length; fi++) {
    const f = mesh.faces[fi];
    const tf = mesh.tfaces[fi];

    if (f.isVisible) {
      faces.push(f);
      tfaces.push(tf);
    }
  }

  return new Mesh(faces, tfaces, mesh.texture);
}

export function clipMesh(mesh: Mesh, plane: Plane) {
  const faces: Face[] = [];
  const tfaces: Face[] = [];

  for (let fi = 0; fi < mesh.faces.length; fi++) {
    const f = mesh.faces[fi];
    const tf = mesh.tfaces[fi];

    const distances = f.vertices.map((v) => {
      return v.sub(plane.position).dot(plane.normal);
    });

    if (distances.every((d) => d <= 0)) {
      continue;
    }

    if (distances.every((d) => d >= 0)) {
      faces.push(f);
      tfaces.push(tf);

      continue;
    }

    const insideIndices = distances
      .map((d, di) => (d > 0 ? di : undefined))
      .filter((di) => di !== undefined);

    const di0 =
      insideIndices.length === 1
        ? insideIndices[0]
        : distances.findIndex((d) => d < 0);

    const di1 = (di0 + 1) % 3;
    const di2 = (di0 + 2) % 3;

    const v0 = f.vertices[di0];
    const v1 = f.vertices[di1];
    const v2 = f.vertices[di2];

    const tv0 = tf.vertices[di0];
    const tv1 = tf.vertices[di1];
    const tv2 = tf.vertices[di2];

    const t0 =
      plane.position.sub(v0).dot(plane.normal) / v1.sub(v0).dot(plane.normal);

    const t1 =
      plane.position.sub(v2).dot(plane.normal) / v0.sub(v2).dot(plane.normal);

    const q0 = v0.scale(1 - t0).sum(v1.scale(t0));
    const q1 = v2.scale(1 - t1).sum(v0.scale(t1));

    const tq0 = tv0.scale(1 - t0).sum(tv1.scale(t0));
    const tq1 = tv2.scale(1 - t1).sum(tv0.scale(t1));

    if (insideIndices.length === 1) {
      faces.push(new Face(v0, q0, q1, f.normal));
      tfaces.push(new Face(tv0, tq0, tq1));

      continue;
    }

    faces.push(new Face(v1, v2, q1, f.normal), new Face(q1, q0, v1, f.normal));
    tfaces.push(new Face(tv1, tv2, tq1), new Face(tq1, tq0, tv1));
  }

  return new Mesh(faces, tfaces, mesh.texture);
}
