import { Pixel } from "./pixel";

export class Screen {
  private readonly context: OffscreenCanvasRenderingContext2D;
  private readonly imageData: ImageData;
  private readonly depthBuffer: number[];
  public readonly width: number;
  public readonly height: number;
  public readonly halfWidth: number;
  public readonly halfHeight: number;
  public readonly aspectRatio: number;

  constructor(canvas: OffscreenCanvas) {
    this.context = canvas.getContext("2d")!;
    this.imageData = this.context.createImageData(canvas.width, canvas.height); // new ImageData(canvas.width, canvas.height);
    this.depthBuffer = new Array(canvas.width * canvas.height).fill(0);
    this.width = this.imageData.width;
    this.height = this.imageData.height;
    this.halfWidth = this.width / 2;
    this.halfHeight = this.height / 2;
    this.aspectRatio = this.height / this.width;
  }

  clearPixels() {
    for (let i = 0, j = 0; i < this.imageData.data.length; i += 4, j++) {
      this.imageData.data[i] = 0;
      this.imageData.data[i + 1] = 0;
      this.imageData.data[i + 2] = 0;
      this.imageData.data[i + 3] = 255;

      this.depthBuffer[j] = 0;
    }
  }

  renderPixels() {
    this.context.putImageData(this.imageData, 0, 0);
  }

  getPixelDepth(depthIndex: number) {
    return this.depthBuffer[depthIndex];
  }

  setPixel(pixel: Pixel, depthIndex: number, depth: number) {
    const pi = depthIndex * 4;

    this.imageData.data[pi] = pixel[0];
    this.imageData.data[pi + 1] = pixel[1];
    this.imageData.data[pi + 2] = pixel[2];
    this.imageData.data[pi + 3] = pixel[3];

    this.depthBuffer[depthIndex] = depth;
  }
}
