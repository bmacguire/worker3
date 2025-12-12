import { Pixel } from "./pixel";

const ZOOM = 2;

export class Screen {
  context: OffscreenCanvasRenderingContext2D;
  bufferContext: OffscreenCanvasRenderingContext2D;
  imageData: ImageData;
  depthBuffer: number[];
  width: number;
  height: number;
  halfWidth: number;
  halfHeight: number;

  // not used for now. it gets simplyfied when
  // doing cals...
  aspectRatio: number;

  constructor(canvas: OffscreenCanvas) {
    this.context = canvas.getContext("2d")!;
    this.context.imageSmoothingEnabled = false;

    this.bufferContext = new OffscreenCanvas(
      canvas.width / ZOOM,
      canvas.height / ZOOM
    ).getContext("2d")!;

    this.bufferContext.imageSmoothingEnabled = false;

    this.imageData = new ImageData(canvas.width / ZOOM, canvas.height / ZOOM);

    this.depthBuffer = new Array(
      (canvas.width * canvas.height) / ZOOM ** 2
    ).fill(0);

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
    this.bufferContext.putImageData(this.imageData, 0, 0);

    this.context.drawImage(
      this.bufferContext.canvas,
      0,
      0,
      this.context.canvas.width,
      this.context.canvas.height
    );
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
