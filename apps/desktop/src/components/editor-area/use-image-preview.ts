import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from "react";
import {
  clampImagePan,
  fitImageTransform,
  getImagePanBounds,
  IMAGE_ZOOM_STEP,
  panImageBy,
  zoomImageAt,
  zoomImageTo,
  type ImagePreviewTransform,
} from "./image-preview-logic";

interface ImageSize {
  width: number;
  height: number;
}

interface ViewportSize {
  width: number;
  height: number;
}

type PreviewStatus = "loading" | "ready" | "error";

const IMAGE_ASSET_EVICTION_DELAY_MS = 60_000;

interface GestureEventLike extends Event {
  scale?: number;
}

function readSize(element: HTMLElement): ViewportSize {
  return { width: element.clientWidth, height: element.clientHeight };
}

export function useImagePreview(reloadVersion: number, isActive = true) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const transformRef = useRef<ImagePreviewTransform>({ zoom: 1, panX: 0, panY: 0 });
  const interactionRef = useRef(false);
  const [viewportSize, setViewportSize] = useState<ViewportSize>({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState<ImageSize | null>(null);
  const [transform, setTransform] = useState<ImagePreviewTransform>(transformRef.current);
  const [status, setStatus] = useState<PreviewStatus>("loading");
  const [isDragging, setIsDragging] = useState(false);
  const [assetRetained, setAssetRetained] = useState(isActive);

  transformRef.current = transform;

  const fitToViewport = useCallback(() => {
    if (!imageSize) return;
    interactionRef.current = false;
    setTransform(
      fitImageTransform(imageSize.width, imageSize.height, viewportSize.width, viewportSize.height),
    );
  }, [imageSize, viewportSize]);

  const zoomAt = useCallback(
    (clientX: number, clientY: number, factor: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      interactionRef.current = true;
      setTransform((current) => {
        const next = zoomImageAt(current, localX, localY, rect.width, rect.height, factor);
        return imageSize
          ? clampImagePan(next, imageSize.width, imageSize.height, rect.width, rect.height)
          : next;
      });
    },
    [imageSize],
  );

  const zoomAtCenter = useCallback(
    (factor: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
    },
    [zoomAt],
  );

  const zoomIn = useCallback(() => zoomAtCenter(IMAGE_ZOOM_STEP), [zoomAtCenter]);
  const zoomOut = useCallback(() => zoomAtCenter(1 / IMAGE_ZOOM_STEP), [zoomAtCenter]);

  const setZoomPercent = useCallback(
    (percent: number) => {
      const viewport = viewportRef.current;
      if (!viewport || !Number.isFinite(percent)) return;
      const rect = viewport.getBoundingClientRect();
      interactionRef.current = true;
      setTransform((current) => {
        const next = zoomImageTo(current, percent / 100, rect.width, rect.height);
        return imageSize
          ? clampImagePan(next, imageSize.width, imageSize.height, rect.width, rect.height)
          : next;
      });
    },
    [imageSize],
  );

  const completeImageLoad = useCallback((image: HTMLImageElement) => {
    if (image.naturalWidth <= 0 || image.naturalHeight <= 0) return;
    setImageSize({ width: image.naturalWidth, height: image.naturalHeight });
    setStatus("ready");
    interactionRef.current = false;
  }, []);

  const handleImageLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      completeImageLoad(event.currentTarget);
    },
    [completeImageLoad],
  );

  const handleImageError = useCallback(() => {
    setStatus("error");
  }, []);

  const handleImageRef = useCallback((image: HTMLImageElement | null) => {
    imageRef.current = image;
  }, []);

  useEffect(() => {
    if (isActive) {
      setAssetRetained(true);
      return;
    }

    const evictionTimer = window.setTimeout(() => {
      setAssetRetained(false);
      setImageSize(null);
      setStatus("loading");
      setTransform({ zoom: 1, panX: 0, panY: 0 });
      interactionRef.current = false;
    }, IMAGE_ASSET_EVICTION_DELAY_MS);

    return () => window.clearTimeout(evictionTimer);
  }, [isActive]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateSize = () => setViewportSize(readSize(viewport));
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!imageSize) return;
    setTransform((current) =>
      interactionRef.current
        ? clampImagePan(
            current,
            imageSize.width,
            imageSize.height,
            viewportSize.width,
            viewportSize.height,
          )
        : fitImageTransform(
            imageSize.width,
            imageSize.height,
            viewportSize.width,
            viewportSize.height,
          ),
    );
  }, [imageSize, viewportSize]);

  useEffect(() => {
    setStatus("loading");
    setImageSize(null);
    interactionRef.current = false;
    setTransform({ zoom: 1, panX: 0, panY: 0 });
  }, [reloadVersion]);

  useEffect(() => {
    const image = imageRef.current;
    if (!assetRetained || !image || !image.complete) return;
    if (image.naturalWidth > 0 && image.naturalHeight > 0) completeImageLoad(image);
    else if (image.currentSrc) handleImageError();
  }, [assetRetained, completeImageLoad, handleImageError, reloadVersion]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let dragPointerId: number | null = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartPanX = 0;
    let dragStartPanY = 0;
    let gestureStartScale: number | null = null;
    let gestureStartTransform: ImagePreviewTransform | null = null;

    const panBy = (deltaX: number, deltaY: number) => {
      if (!imageSize || (deltaX === 0 && deltaY === 0)) return;
      const rect = viewport.getBoundingClientRect();
      const { maxPanX, maxPanY } = getImagePanBounds(
        imageSize.width,
        imageSize.height,
        transformRef.current.zoom,
        rect.width,
        rect.height,
      );
      if (maxPanX === 0 && maxPanY === 0) return;
      interactionRef.current = true;
      setTransform((current) =>
        panImageBy(
          current,
          deltaX,
          deltaY,
          imageSize.width,
          imageSize.height,
          rect.width,
          rect.height,
        ),
      );
    };

    const isControlTarget = (target: EventTarget | null) =>
      target instanceof Element && target.closest("[data-image-preview-controls]") !== null;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || isControlTarget(event.target)) return;
      dragPointerId = event.pointerId;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      dragStartPanX = transformRef.current.panX;
      dragStartPanY = transformRef.current.panY;
      interactionRef.current = true;
      setIsDragging(true);
      viewport.setPointerCapture(event.pointerId);
      viewport.focus({ preventScroll: true });
      event.preventDefault();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (dragPointerId !== event.pointerId) return;
      const rect = viewport.getBoundingClientRect();
      setTransform((current) =>
        imageSize
          ? clampImagePan(
              {
                ...current,
                panX: dragStartPanX + event.clientX - dragStartX,
                panY: dragStartPanY + event.clientY - dragStartY,
              },
              imageSize.width,
              imageSize.height,
              rect.width,
              rect.height,
            )
          : current,
      );
    };

    const endDrag = (event: PointerEvent) => {
      if (dragPointerId !== event.pointerId) return;
      dragPointerId = null;
      setIsDragging(false);
      if (viewport.hasPointerCapture(event.pointerId))
        viewport.releasePointerCapture(event.pointerId);
    };

    const onWheel = (event: WheelEvent) => {
      if (isControlTarget(event.target)) return;
      if (event.metaKey || event.ctrlKey) {
        event.preventDefault();
        const sensitivity = event.ctrlKey && !event.metaKey ? 0.01 : 0.0015;
        zoomAt(event.clientX, event.clientY, Math.exp(-event.deltaY * sensitivity));
        return;
      }

      if (!imageSize || (event.deltaX === 0 && event.deltaY === 0)) return;
      const rect = viewport.getBoundingClientRect();
      const { maxPanX, maxPanY } = getImagePanBounds(
        imageSize.width,
        imageSize.height,
        transformRef.current.zoom,
        rect.width,
        rect.height,
      );
      if (maxPanX === 0 && maxPanY === 0) return;
      event.preventDefault();
      panBy(-event.deltaX, -event.deltaY);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isControlTarget(event.target)) return;
      let handled = true;
      switch (event.key) {
        case "ArrowUp":
          panBy(0, 24);
          break;
        case "ArrowDown":
          panBy(0, -24);
          break;
        case "ArrowLeft":
          panBy(24, 0);
          break;
        case "ArrowRight":
          panBy(-24, 0);
          break;
        case "+":
        case "=":
          zoomIn();
          break;
        case "-":
        case "_":
          zoomOut();
          break;
        case "0":
          fitToViewport();
          break;
        default:
          handled = false;
      }
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const onGestureStart = (event: Event) => {
      if (isControlTarget(event.target)) return;
      const gesture = event as GestureEventLike;
      if (typeof gesture.scale !== "number") return;
      gestureStartScale = gesture.scale;
      gestureStartTransform = transformRef.current;
      event.preventDefault();
    };

    const onGestureChange = (event: Event) => {
      if (isControlTarget(event.target)) return;
      const gesture = event as GestureEventLike;
      if (
        typeof gesture.scale !== "number" ||
        gestureStartScale === null ||
        gestureStartTransform === null
      )
        return;
      const rect = viewport.getBoundingClientRect();
      interactionRef.current = true;
      const next = zoomImageAt(
        gestureStartTransform,
        rect.width / 2,
        rect.height / 2,
        rect.width,
        rect.height,
        gesture.scale / gestureStartScale,
      );
      setTransform(
        imageSize
          ? clampImagePan(next, imageSize.width, imageSize.height, rect.width, rect.height)
          : next,
      );
      event.preventDefault();
    };

    const onGestureEnd = () => {
      gestureStartScale = null;
      gestureStartTransform = null;
    };

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    viewport.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("keydown", onKeyDown);
    viewport.addEventListener("gesturestart", onGestureStart, { passive: false });
    viewport.addEventListener("gesturechange", onGestureChange, { passive: false });
    viewport.addEventListener("gestureend", onGestureEnd);

    return () => {
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", endDrag);
      viewport.removeEventListener("pointercancel", endDrag);
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("keydown", onKeyDown);
      viewport.removeEventListener("gesturestart", onGestureStart);
      viewport.removeEventListener("gesturechange", onGestureChange);
      viewport.removeEventListener("gestureend", onGestureEnd);
    };
  }, [fitToViewport, imageSize, zoomAt, zoomIn, zoomOut]);

  return {
    viewportRef,
    handleImageRef,
    imageSize,
    status,
    assetRetained,
    isDragging,
    transform,
    fitToViewport,
    zoomIn,
    zoomOut,
    setZoomPercent,
    handleImageLoad,
    handleImageError,
  };
}
