export class Texture {
  readonly pixels: [number, number, number, number][][];
  readonly width: number;
  readonly height: number;

  constructor(imageData: ImageData) {
    const rows: [number, number, number, number][][] = [];

    for (let i = 0; i < imageData.height; i++) {
      const row: [number, number, number, number][] = [];

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
}

export async function buildTexture(imageBlob: Blob) {
  const image = new Image();

  return new Promise<Texture>((resolve, reject) => {
    try {
      image.addEventListener("load", () => {
        const canvas = new OffscreenCanvas(image.width, image.height);
        const context = canvas.getContext("2d")!;

        context.drawImage(image, 0, 0);

        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        URL.revokeObjectURL(image.src);

        resolve(new Texture(imageData));
      });

      image.src = URL.createObjectURL(imageBlob);
    } catch (exception) {
      reject(exception);
    }
  });
}
