import { Face } from "./face";
import { Vector } from "./vector";
import { buildRotation } from "./matrix";

export class Mesh {
  faces: Face[];

  constructor(...faces: Face[]) {
    this.faces = faces;
  }

  translateSelf(vector: Vector) {
    this.faces = this.faces.map((face) => {
      return new Face(
        face.vertices[0].sum(vector),
        face.vertices[1].sum(vector),
        face.vertices[2].sum(vector)
      );
    });

    return this;
  }

  rotateSelf(unitVector: Vector, angle: number) {
    const rotation = buildRotation(unitVector, angle);

    this.faces = this.faces.map((face) => {
      return new Face(
        face.vertices[0].transform(rotation),
        face.vertices[1].transform(rotation),
        face.vertices[2].transform(rotation)
      );
    });

    return this;
  }
}

export async function buildMeshFromObj(blob: Blob) {
  try {
    const content = await blob.text();
    const lines = content.split(/\r?\n/gm);
    const vertices: Vector[] = [];
    const faces: Face[] = [];

    for (const line of lines) {
      const parts = line.split(" ");
      const type = parts.shift() ?? "";

      if (!["v", "f"].includes(type) || parts.length !== 3) {
        continue;
      }

      if (type === "v") {
        vertices.push(
          new Vector(Number(parts[0]), Number(parts[1]), Number(parts[2]))
        );

        continue;
      }

      const vertex1Ix = parseInt(parts[0]);
      const vertex2Ix = parseInt(parts[1]);
      const vertex3Ix = parseInt(parts[2]);

      const vertex1 = vertices[vertex1Ix - 1];
      const vertex2 = vertices[vertex2Ix - 1];
      const vertex3 = vertices[vertex3Ix - 1];

      if (!vertex1 || !vertex2 || !vertex3) {
        continue;
      }

      faces.push(new Face(vertex1, vertex2, vertex3));
    }

    if (faces.length === 0) {
      throw Error("No faces");
    }

    return new Mesh(...faces);
  } catch (exception) {
    throw exception;
  }
}
