import { Texture } from "./texture";
import { Mesh } from "./mesh";
import { Space } from "./space";
import { Vector } from "./vector";
import { Face } from "./face";

async function init() {
  const canvas = document.querySelector("canvas")!.transferControlToOffscreen();
  const space = new Space(canvas, Math.PI / 2, 0.1, 10_000);

  const brickTexture = await Texture.build(
    await (await fetch("/textures/brick.png")).blob()
  );

  const cubeBlob = await (await fetch(`/objs/cube.obj`)).blob();

  const cubeMeshes = await Promise.all(
    new Array(10).fill(0).map(async (_, i) => {
      const mesh = await Mesh.build(cubeBlob, brickTexture);

      const gfaces = mesh.gfaces.map((gf) => {
        return new Face(
          ...(gf.vertices.map((v) => v.add(new Vector(0, 0, i))) as [
            Vector,
            Vector,
            Vector
          ])
        );
      });

      return new Mesh(gfaces, mesh.tfaces, mesh.texture);
    })
  );

  const fpsDiv = document.querySelector<HTMLDivElement>("#fps")!;

  let time = 0;
  let bufferTime = 0;

  function loop(newTime: number) {
    const deltaTime = newTime - time;
    bufferTime += deltaTime;

    if (bufferTime > 300) {
      const fps = Math.round(1000 / deltaTime);

      fpsDiv.textContent = String(fps);

      bufferTime = 0;
    }

    time = newTime;

    space.camera.update();
    space.render(...cubeMeshes);

    requestAnimationFrame(loop);
  }

  loop(0);
}

addEventListener("load", init);
