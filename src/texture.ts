import { Pixel } from "./pixel";

export class Texture {
  readonly pixels: Pixel[][];
  readonly width: number;
  readonly height: number;

  constructor(imageData: ImageData) {
    const rows: Pixel[][] = [];

    for (let i = 0; i < imageData.height; i++) {
      const row: Pixel[] = [];

      for (let j = 0; j < imageData.width; j++) {
        const pi = (i * imageData.width + j) * 4;

        row.push([
          imageData.data[pi],
          imageData.data[pi + 1],
          imageData.data[pi + 2],
          imageData.data[pi + 3],
        ]);
      }

      rows.push(row);
    }

    this.pixels = rows;

    this.width = imageData.width;
    this.height = imageData.height;
  }

  static async build(blob: Blob) {
    const image = new Image();

    return new Promise<Texture>((resolve) => {
      image.addEventListener("load", () => {
        const context = new OffscreenCanvas(
          image.width,
          image.height
        ).getContext("2d")!;

        context.drawImage(image, 0, 0);

        const imageData = context.getImageData(
          0,
          0,
          context.canvas.width,
          context.canvas.height
        );

        URL.revokeObjectURL(image.src);

        resolve(new Texture(imageData));
      });

      image.src = URL.createObjectURL(blob);
    });
  }
}
