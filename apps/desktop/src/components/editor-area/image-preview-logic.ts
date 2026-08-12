export interface ImagePreviewTransform {
  zoom: number;
  panX: number;
  panY: number;
}

export interface ImagePanBounds {
  maxPanX: number;
  maxPanY: number;
}

export const IMAGE_ZOOM_MIN = 0.25;
export const IMAGE_ZOOM_MAX = 4;
export const IMAGE_ZOOM_STEP = 1.2;
export const IMAGE_FIT_MARGIN = 32;

export function parseZoomPercentInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(/%\s*$/, "").trim();
  if (!normalized) return null;

  const percent = Number(normalized);
  return Number.isFinite(percent) ? percent : null;
}

export function clampImageZoom(zoom: number): number {
  return Math.max(IMAGE_ZOOM_MIN, Math.min(IMAGE_ZOOM_MAX, zoom));
}

export function getImagePanBounds(
  naturalWidth: number,
  naturalHeight: number,
  zoom: number,
  viewportWidth: number,
  viewportHeight: number,
): ImagePanBounds {
  return {
    maxPanX: Math.max(0, (naturalWidth * zoom - viewportWidth) / 2),
    maxPanY: Math.max(0, (naturalHeight * zoom - viewportHeight) / 2),
  };
}

export function clampImagePan(
  transform: ImagePreviewTransform,
  naturalWidth: number,
  naturalHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): ImagePreviewTransform {
  const { maxPanX, maxPanY } = getImagePanBounds(
    naturalWidth,
    naturalHeight,
    transform.zoom,
    viewportWidth,
    viewportHeight,
  );

  const clampPan = (value: number, max: number) =>
    max === 0 ? 0 : Math.max(-max, Math.min(max, value));

  return {
    ...transform,
    panX: clampPan(transform.panX, maxPanX),
    panY: clampPan(transform.panY, maxPanY),
  };
}

export function panImageBy(
  transform: ImagePreviewTransform,
  deltaX: number,
  deltaY: number,
  naturalWidth: number,
  naturalHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): ImagePreviewTransform {
  return clampImagePan(
    {
      ...transform,
      panX: transform.panX + deltaX,
      panY: transform.panY + deltaY,
    },
    naturalWidth,
    naturalHeight,
    viewportWidth,
    viewportHeight,
  );
}

export function fitImageTransform(
  naturalWidth: number,
  naturalHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): ImagePreviewTransform {
  if (naturalWidth <= 0 || naturalHeight <= 0 || viewportWidth <= 0 || viewportHeight <= 0) {
    return { zoom: 1, panX: 0, panY: 0 };
  }

  const fit = Math.min(
    (viewportWidth - IMAGE_FIT_MARGIN * 2) / naturalWidth,
    (viewportHeight - IMAGE_FIT_MARGIN * 2) / naturalHeight,
  );
  return { zoom: clampImageZoom(fit), panX: 0, panY: 0 };
}

export function zoomImageAt(
  transform: ImagePreviewTransform,
  localX: number,
  localY: number,
  viewportWidth: number,
  viewportHeight: number,
  factor: number,
): ImagePreviewTransform {
  const nextZoom = clampImageZoom(transform.zoom * factor);
  if (nextZoom === transform.zoom) return transform;

  const imageX = (localX - viewportWidth / 2 - transform.panX) / transform.zoom;
  const imageY = (localY - viewportHeight / 2 - transform.panY) / transform.zoom;

  return {
    zoom: nextZoom,
    panX: localX - viewportWidth / 2 - imageX * nextZoom,
    panY: localY - viewportHeight / 2 - imageY * nextZoom,
  };
}

export function zoomImageTo(
  transform: ImagePreviewTransform,
  zoom: number,
  viewportWidth: number,
  viewportHeight: number,
): ImagePreviewTransform {
  const nextZoom = clampImageZoom(zoom);
  if (nextZoom === transform.zoom) return transform;

  return zoomImageAt(
    transform,
    viewportWidth / 2,
    viewportHeight / 2,
    viewportWidth,
    viewportHeight,
    nextZoom / transform.zoom,
  );
}
