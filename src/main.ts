import { buildTexture } from "./texture";
import { buildMesh } from "./mesh";
import { Space } from "./space";

async function init() {
  const canvas = document.querySelector("canvas")!;
  const space = new Space(canvas, Math.PI * 0.5, 0.1, 1000);

  const objBlob = await (await fetch(`/objs/cube.obj`)).blob();
  const imageBlob = await (await fetch(`/textures/lucy.png`)).blob();
  const texture = await buildTexture(imageBlob);
  let mesh = await buildMesh(objBlob, texture);

  const fpsDiv = document.querySelector<HTMLDivElement>("#fps")!;
  let time = 0;

  function loop(newTime: number) {
    fpsDiv.textContent = `fps: ${Math.round(1000 / (newTime - time))}`;

    time = newTime;

    space.clear();
    space.camera.update();
    space.render(mesh);

    requestAnimationFrame(loop);
  }

  loop(0);
}

addEventListener("load", init);
