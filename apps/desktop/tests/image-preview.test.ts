import { describe, expect, test } from "vite-plus/test";
import {
  clampImageZoom,
  fitImageTransform,
  zoomImageAt,
} from "../src/components/editor-area/image-preview-logic";

describe("image preview transform", () => {
  test("fits a wide image inside the viewport and starts centered", () => {
    expect(fitImageTransform(1600, 900, 800, 600)).toEqual({
      zoom: 0.46,
      panX: 0,
      panY: 0,
    });
  });

  test("caps tiny images at the maximum zoom", () => {
    expect(fitImageTransform(40, 40, 1200, 800).zoom).toBe(4);
  });

  test("anchors zoom at the pointer location", () => {
    const initial = { zoom: 1, panX: 0, panY: 0 };
    const next = zoomImageAt(initial, 750, 250, 1000, 500, 2);

    expect(next).toEqual({ zoom: 2, panX: -250, panY: 0 });
    expect(500 + next.panX + 250 * next.zoom).toBe(750);
    expect(250 + next.panY).toBe(250);
  });

  test("clamps zoom and leaves a saturated transform unchanged", () => {
    expect(clampImageZoom(0.01)).toBe(0.25);
    expect(clampImageZoom(20)).toBe(4);

    const saturated = { zoom: 4, panX: 12, panY: -8 };
    expect(zoomImageAt(saturated, 100, 100, 200, 200, 2)).toBe(saturated);
  });
});
