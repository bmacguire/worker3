import { Vector } from "./vector";
import { Face } from "./face";
import { Mesh, buildMeshFromObj } from "./mesh";
import { Space } from "./space";

async function fetchObj(name: string) {
  return await (await fetch(`/objs/${name}.obj`)).blob();
}

function buildCube() {
  const f0 = new Vector(-1, -1, 2);
  const f1 = new Vector(-1, 1, 2);
  const f2 = new Vector(1, 1, 2);
  const f3 = new Vector(1, -1, 2);

  const b0 = new Vector(-1, -1, 4);
  const b1 = new Vector(-1, 1, 4);
  const b2 = new Vector(1, 1, 4);
  const b3 = new Vector(1, -1, 4);

  return [
    new Face(f0, f1, f3),
    new Face(f3, f1, f2),

    new Face(f3, f2, b3),
    new Face(b3, f2, b2),

    new Face(b3, b2, b0),
    new Face(b0, b2, b1),

    new Face(b0, b1, f0),
    new Face(f0, b1, f1),

    new Face(b0, f0, b3),
    new Face(b3, f0, f3),

    new Face(f1, b1, f2),
    new Face(f2, b1, b2),
  ];
}

async function init() {
  const canvas = document.querySelector("canvas")!;
  const space = new Space(canvas, Math.PI * 0.5, 0.1, 1000);

  const obj = await fetchObj("teapot");

  const mesh = await buildMeshFromObj(obj);
  mesh
    .rotateSelf(Vector.k, Math.PI)
    //.rotateSelf(Vector.i, Math.PI * 0.5)
    .translateSelf(new Vector(0, 1, 4));

  //const mesh = new Mesh(...buildCube());

  function loop() {
    space.clear();
    space.camera.update();
    space.render(mesh);

    requestAnimationFrame(loop);
  }

  loop();
}

addEventListener("load", init);
