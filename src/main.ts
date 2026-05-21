import { Texture, TEXTURE_WHITE } from './texture';
import { Mesh } from './mesh';
import { Space } from './space';
import { Vector } from './vector';
import { Face } from './face';
import { buildRotation } from './matrix';

async function init() {
  const canvas = document.querySelector('canvas')!.transferControlToOffscreen();
  const space = new Space(canvas, Math.PI / 2, 0.1, 10_000);

  const teapotBlob = await (await fetch(`/objs/teapot.obj`)).blob();

  const chessBlob = await (await fetch(`/textures/chess.png`)).blob();

  const teapotTexture = await Texture.build(chessBlob);

  const teapotMesh = await Mesh.build(teapotBlob, teapotTexture);

  const mat = buildRotation(Vector.k(), Math.PI);

  const gfaces = teapotMesh.gfaces.map((f) => {
    return new Face(
      f.vertices[0].add(new Vector(0, -1, 5)).transform(mat),
      f.vertices[1].add(new Vector(0, -1, 5)).transform(mat),
      f.vertices[2].add(new Vector(0, -1, 5)).transform(mat),
    );
  });

  const meshes = new Array(5).fill(0).map((_, i) => {
    const gfaces2 = gfaces.map((f) => {
      return new Face(
        f.vertices[0].add(new Vector(-6 + 6 * i, 0, 0)),
        f.vertices[1].add(new Vector(-6 + 6 * i, 0, 0)),
        f.vertices[2].add(new Vector(-6 + 6 * i, 0, 0)),
      );
    });

    return new Mesh(gfaces2, teapotMesh.tfaces, teapotMesh.texture);
  });

  const fpsDiv = document.querySelector<HTMLDivElement>('#fps')!;

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
    space.render(...meshes);

    requestAnimationFrame(loop);
  }

  loop(0);
}

addEventListener('load', init);
