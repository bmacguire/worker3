import { Vector } from "./vector";
import { Face } from "./face";
import { Texture } from "./texture";
import { Plane } from "./plane";

export class Mesh {
  gfaces: Face[];
  tfaces: Face[];
  texture: Texture;

  constructor(gfaces: Face[], tfaces: Face[], texture: Texture) {
    this.gfaces = gfaces;
    this.tfaces = tfaces;
    this.texture = texture;
  }

  static async build(obj: Blob, texture: Texture) {
    const gvertices: Vector[] = [];
    const tvertices: Vector[] = [];
    const gfaces: Face[] = [];
    const tfaces: Face[] = [];

    const content = await obj.text();
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

        gvertices.push(new Vector(numbers[0], numbers[1], numbers[2]));

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

      const [gvi0, tvi0] = parts[0].split("/").map((x) => parseInt(x.trim()));
      const [gvi1, tvi1] = parts[1].split("/").map((x) => parseInt(x.trim()));
      const [gvi2, tvi2] = parts[2].split("/").map((x) => parseInt(x.trim()));

      const gfaceHasError = [gvi0, gvi1, gvi2].some((gvi) => {
        return !gvertices[gvi - 1];
      });

      if (gfaceHasError) {
        continue;
      }

      gfaces.push(
        new Face(gvertices[gvi0 - 1], gvertices[gvi1 - 1], gvertices[gvi2 - 1])
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

    if (tfaces.length === 0) {
      tfaces.push(
        ...gfaces.map(
          () =>
            new Face(
              new Vector(0, 0, 0),
              new Vector(0, 1, 0),
              new Vector(1, 1, 0)
            )
        )
      );
    }

    if (gfaces.length !== tfaces.length || gfaces.length === 0) {
      throw Error("Invalid OBJ file");
    }

    return new Mesh(gfaces, tfaces, texture);
  }

  asVisible() {
    const gfaces: Face[] = [];
    const tfaces: Face[] = [];

    for (let fi = 0; fi < this.gfaces.length; fi++) {
      const gf = this.gfaces[fi];
      const tf = this.tfaces[fi];

      if (gf.visible) {
        gfaces.push(gf);
        tfaces.push(tf);
      }
    }

    return new Mesh(gfaces, tfaces, this.texture);
  }

  clip(plane: Plane) {
    const gfaces: Face[] = [];
    const tfaces: Face[] = [];

    for (let fi = 0; fi < this.gfaces.length; fi++) {
      const gf = this.gfaces[fi];
      const tf = this.tfaces[fi];

      const distances = gf.vertices.map((v) => {
        return v.sub(plane.position).dot(plane.normal);
      });

      if (distances.every((d) => d <= 0)) {
        continue;
      }

      if (distances.every((d) => d >= 0)) {
        gfaces.push(gf);
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

      const gv0 = gf.vertices[di0];
      const gv1 = gf.vertices[di1];
      const gv2 = gf.vertices[di2];

      const tv0 = tf.vertices[di0];
      const tv1 = tf.vertices[di1];
      const tv2 = tf.vertices[di2];

      const t0 =
        plane.position.sub(gv0).dot(plane.normal) /
        gv1.sub(gv0).dot(plane.normal);

      const t1 =
        plane.position.sub(gv2).dot(plane.normal) /
        gv0.sub(gv2).dot(plane.normal);

      const gq0 = gv0.scale(1 - t0).add(gv1.scale(t0));
      const gq1 = gv2.scale(1 - t1).add(gv0.scale(t1));

      const tq0 = tv0.scale(1 - t0).add(tv1.scale(t0));
      const tq1 = tv2.scale(1 - t1).add(tv0.scale(t1));

      if (insideIndices.length === 1) {
        gfaces.push(new Face(gv0, gq0, gq1, gf.normal));
        tfaces.push(new Face(tv0, tq0, tq1));

        continue;
      }

      gfaces.push(
        new Face(gv1, gv2, gq1, gf.normal),
        new Face(gq1, gq0, gv1, gf.normal)
      );

      tfaces.push(new Face(tv1, tv2, tq1), new Face(tq1, tq0, tv1));
    }

    return new Mesh(gfaces, tfaces, this.texture);
  }
}
