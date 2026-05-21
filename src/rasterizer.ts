import { round } from './math';
import { Mesh } from './mesh';
import { Vector } from './vector';
import { Screen } from './screen';

export class Rasterizer {
  screen: Screen;

  constructor(screen: Screen) {
    this.screen = screen;
  }

  rasterize(mesh: Mesh) {
    for (let fi = 0; fi < mesh.gfaces.length; fi++) {
      const gf = mesh.gfaces[fi];
      const tf = mesh.tfaces[fi];

      let [[x1, y1, u1, v1, w1], [x2, y2, u2, v2, w2], [x3, y3, u3, v3, w3]] =
        gf.vertices
          .map((gv, vi) => [gv, vi] as [Vector, number])
          .sort(([gv1], [gv2]) => gv1.y - gv2.y)
          .map(([gv, vi]) => [
            round(gv.x),
            round(gv.y),
            tf.vertices[vi].x,
            tf.vertices[vi].y,
            tf.vertices[vi].z,
          ]);

      let dy1 = y2 - y1;
      let dx1 = x2 - x1;
      let dv1 = v2 - v1;
      let du1 = u2 - u1;
      let dw1 = w2 - w1;

      let dy2 = y3 - y1;
      let dx2 = x3 - x1;
      let dv2 = v3 - v1;
      let du2 = u3 - u1;
      let dw2 = w3 - w1;

      let tex_u = 0;
      let tex_v = 0;
      let tex_w = 0;

      let daxStep = 0;
      let dbxStep = 0;

      let du1_step = 0;
      let dv1_step = 0;
      let du2_step = 0;
      let dv2_step = 0;
      let dw1_step = 0;
      let dw2_step = 0;

      if (dy1 !== 0) {
        daxStep = dx1 / dy1;

        du1_step = du1 / dy1;
        dv1_step = dv1 / dy1;
        dw1_step = dw1 / dy1;
      }

      if (dy2 !== 0) {
        dbxStep = dx2 / dy2;

        du2_step = du2 / dy2;
        dv2_step = dv2 / dy2;
        dw2_step = dw2 / dy2;
      }

      if (dy1) {
        for (let i = y1; i <= y2; i++) {
          const di = i - y1;

          let ax = round(x1 + di * daxStep);
          let bx = round(x1 + di * dbxStep);

          let tex_su = u1 + di * du1_step;
          let tex_sv = v1 + di * dv1_step;
          let tex_sw = w1 + di * dw1_step;

          let tex_eu = u1 + di * du2_step;
          let tex_ev = v1 + di * dv2_step;
          let tex_ew = w1 + di * dw2_step;

          if (ax > bx) {
            [ax, bx] = [bx, ax];
            [tex_su, tex_eu] = [tex_eu, tex_su];
            [tex_sv, tex_ev] = [tex_ev, tex_sv];
            [tex_sw, tex_ew] = [tex_ew, tex_sw];
          }

          const dtexu = tex_eu - tex_su;
          const dtexv = tex_ev - tex_sv;
          const dtexw = tex_ew - tex_sw;

          tex_u = tex_su;
          tex_v = tex_sv;
          tex_w = tex_sw;

          let tstep = 1 / (bx - ax);
          let t = 0;

          const startDepthIndex = i * this.screen.width;

          for (let j = ax; j <= bx; j++) {
            const depthIndex = startDepthIndex + j;
            const depth = this.screen.getPixelDepth(depthIndex);

            tex_w = tex_sw + dtexw * t;

            if (tex_w > depth) {
              tex_u = tex_su + dtexu * t;
              tex_v = tex_sv + dtexv * t;

              const u = round((tex_u * mesh.texture.widthMinus1) / tex_w);
              const v = round((tex_v * mesh.texture.heightMinus1) / tex_w);

              const pixel = mesh.texture.pixels[v][u];
              const px = [
                pixel[0] * gf.visibility,
                pixel[1] * gf.visibility,
                pixel[2] * gf.visibility,
                255,
              ] as typeof pixel;

              this.screen.setPixel(px, depthIndex, tex_w);
            }

            t += tstep;
          }
        }
      }

      dy1 = y3 - y2;
      dx1 = x3 - x2;
      dv1 = v3 - v2;
      du1 = u3 - u2;
      dw1 = w3 - w2;

      if (dy1 !== 0) {
        daxStep = dx1 / dy1;

        du1_step = du1 / dy1;
        dv1_step = dv1 / dy1;
        dw1_step = dw1 / dy1;
      }

      if (dy1) {
        for (let i = y2; i <= y3; i++) {
          const di2 = i - y2;
          const di1 = i - y1;

          let ax = round(x2 + di2 * daxStep);
          let bx = round(x1 + di1 * dbxStep);

          let tex_su = u2 + di2 * du1_step;
          let tex_sv = v2 + di2 * dv1_step;
          let tex_sw = w2 + di2 * dw1_step;

          let tex_eu = u1 + di1 * du2_step;
          let tex_ev = v1 + di1 * dv2_step;
          let tex_ew = w1 + di1 * dw2_step;

          if (ax > bx) {
            [ax, bx] = [bx, ax];
            [tex_su, tex_eu] = [tex_eu, tex_su];
            [tex_sv, tex_ev] = [tex_ev, tex_sv];
            [tex_sw, tex_ew] = [tex_ew, tex_sw];
          }

          const dtexu = tex_eu - tex_su;
          const dtexv = tex_ev - tex_sv;
          const dtexw = tex_ew - tex_sw;

          tex_u = tex_su;
          tex_v = tex_sv;
          tex_w = tex_sw;

          let tstep = 1 / (bx - ax);
          let t = 0;

          const startDepthIndex = i * this.screen.width;

          for (let j = ax; j <= bx; j++) {
            const depthIndex = startDepthIndex + j;
            const depth = this.screen.getPixelDepth(depthIndex);

            tex_w = tex_sw + dtexw * t;

            if (tex_w > depth) {
              tex_u = tex_su + dtexu * t;
              tex_v = tex_sv + dtexv * t;

              const u = round((tex_u * mesh.texture.widthMinus1) / tex_w);
              const v = round((tex_v * mesh.texture.heightMinus1) / tex_w);

              const pixel = mesh.texture.pixels[v][u];
              const px = [
                pixel[0] * gf.visibility,
                pixel[1] * gf.visibility,
                pixel[2] * gf.visibility,
                255,
              ] as typeof pixel;

              this.screen.setPixel(px, depthIndex, tex_w);
            }

            t += tstep;
          }
        }
      }
    }
  }
}
