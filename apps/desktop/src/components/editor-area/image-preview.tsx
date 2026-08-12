import { useFileSizeBytes, useReloadVersion } from "@/hooks/use-tabs";
import { getFileName } from "@/lib/paths";
import { resolveLocalAssetSrc } from "./image-src-resolver";
import { useImagePreview } from "./use-image-preview";
import "./image-preview.css";

interface ImagePreviewPaneProps {
  path: string;
  isActive: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImagePreviewPane({ path, isActive }: ImagePreviewPaneProps) {
  const reloadVersion = useReloadVersion(path);
  const sizeBytes = useFileSizeBytes(path);
  const preview = useImagePreview(reloadVersion, isActive);
  const imageSrc = `${resolveLocalAssetSrc(path)}?reload=${reloadVersion}`;
  const filename = getFileName(path);

  return (
    <div
      data-pane
      className={
        isActive
          ? "image-preview-pane relative z-10 h-full"
          : "image-preview-pane absolute inset-0 invisible pointer-events-none"
      }
    >
      <div
        ref={preview.viewportRef}
        tabIndex={0}
        role="region"
        aria-label={`Image preview for ${filename}`}
        className={`image-preview-viewport${preview.isDragging ? " is-dragging" : ""}`}
      >
        {preview.assetRetained ? (
          <div
            className={`image-preview-stage${preview.status === "ready" ? " is-loaded" : ""}`}
            style={{
              left: `calc(50% + ${preview.transform.panX}px)`,
              top: `calc(50% + ${preview.transform.panY}px)`,
              ...(preview.imageSize
                ? { width: preview.imageSize.width, height: preview.imageSize.height }
                : {}),
              transform: `translate(-50%, -50%) scale(${preview.transform.zoom})`,
            }}
          >
            <img
              key={reloadVersion}
              src={imageSrc}
              alt={filename}
              draggable={false}
              onLoad={preview.handleImageLoad}
              onError={preview.handleImageError}
            />
          </div>
        ) : null}
        {preview.status === "loading" ? (
          <div className="image-preview-message">Loading image…</div>
        ) : preview.status === "error" ? (
          <div className="image-preview-message">
            <div className="font-medium text-[var(--text-secondary)]">Unable to preview image</div>
            <div className="mt-1 text-[12px] text-[var(--text-muted)]">{filename}</div>
          </div>
        ) : null}

        <div className="image-preview-info" aria-live="polite">
          {preview.imageSize
            ? `${preview.imageSize.width} × ${preview.imageSize.height} · ${formatBytes(sizeBytes)}`
            : filename}
        </div>

        <div className="image-preview-controls" data-image-preview-controls>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={preview.fitToViewport}
            aria-label="Fit image to window"
          >
            <span aria-hidden="true">⟲</span>
          </button>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={preview.zoomOut}
            aria-label="Zoom out"
          >
            <span aria-hidden="true">−</span>
          </button>
          <span
            className="image-preview-zoom"
            aria-label={`${Math.round(preview.transform.zoom * 100)} percent zoom`}
          >
            {Math.round(preview.transform.zoom * 100)}%
          </span>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={preview.zoomIn}
            aria-label="Zoom in"
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
      </div>
    </div>
  );
}
