import { Texture } from "./texture";
import { Mesh } from "./mesh";
import { Space } from "./space";
//import { Vector } from "./vector";

// RASTERIZE IS THE ONE FOR PERFORMANCE!!!
// but also check others...

async function init() {
  const canvas = document.querySelector("canvas")!.transferControlToOffscreen();

  const paperTexture = await Texture.build(
    await (await fetch(`/textures/paper.jpg`)).blob()
  );

  const rockTexture = await Texture.build(
    await (await fetch(`/textures/rock.webp`)).blob()
  );

  const space = new Space(canvas, Math.PI * 0.5, 0.1, 10000);

  const teapotObj = await (await fetch(`/objs/teapot.obj`)).blob();
  const teapotMesh = await Mesh.build(teapotObj, paperTexture);

  const mountainsObj = await (await fetch(`/objs/mountains.obj`)).blob();
  const mountainsMesh = await Mesh.build(mountainsObj, rockTexture);

  const fpsElement = document.querySelector<HTMLDivElement>("#fps")!;
  fpsElement.style.fontWeight = "bold";

  let time = 0;
  let bufferTime = 0;

  function loop(newTime: number) {
    const deltaTime = newTime - time;
    bufferTime += deltaTime;

    if (bufferTime > 300) {
      const fps = Math.round(1000 / deltaTime);

      fpsElement.style.color = fps < 60 ? "red" : "green";
      fpsElement.textContent = String(fps);

      bufferTime = 0;
    }

    time = newTime;

    space.camera.update();
    space.render(teapotMesh, mountainsMesh);

    requestAnimationFrame(loop);
  }

  loop(0);
}

addEventListener("load", init);
