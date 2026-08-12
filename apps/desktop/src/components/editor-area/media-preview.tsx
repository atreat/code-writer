import { useEffect, useRef, useState } from "react";
import { useFileSizeBytes, useReloadVersion } from "@/hooks/use-tabs";
import { getFileName } from "@/lib/paths";
import type { WorkspaceEntryKind } from "@/types/fs";
import { resolveLocalAssetSrc } from "./image-src-resolver";
import "./media-preview.css";

type MediaPreviewKind = Extract<WorkspaceEntryKind, "audio" | "video">;
type MediaStatus = "loading" | "ready" | "error";

interface MediaPreviewPaneProps {
  path: string;
  kind: MediaPreviewKind;
  isActive: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function errorLabel(kind: MediaPreviewKind) {
  return kind === "audio" ? "Unable to play audio" : "Unable to play video";
}

function loadingLabel(kind: MediaPreviewKind) {
  return kind === "audio" ? "Loading audio…" : "Loading video…";
}

function MediaError({ kind, filename }: { kind: MediaPreviewKind; filename: string }) {
  return (
    <div className="media-preview-error" role="alert">
      <div className="font-medium text-[var(--text-secondary)]">{errorLabel(kind)}</div>
      <div className="mt-1 text-[12px] text-[var(--text-muted)]">
        {filename} · The format or codec may not be supported by the system player.
      </div>
    </div>
  );
}

export function MediaPreviewPane({ path, kind, isActive }: MediaPreviewPaneProps) {
  const reloadVersion = useReloadVersion(path);
  const sizeBytes = useFileSizeBytes(path);
  const [status, setStatus] = useState<MediaStatus>("loading");
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const filename = getFileName(path);
  const mediaSrc = `${resolveLocalAssetSrc(path)}?reload=${reloadVersion}`;

  useEffect(() => {
    setStatus("loading");
  }, [path, reloadVersion]);

  useEffect(() => {
    if (!isActive) {
      audioRef.current?.pause();
      videoRef.current?.pause();
    }
  }, [isActive]);

  function handleLoadedMetadata() {
    setStatus("ready");
  }

  function handleError() {
    setStatus("error");
  }

  const media =
    kind === "audio" ? (
      <audio
        ref={audioRef}
        key={`${path}-${reloadVersion}`}
        className="media-preview-audio"
        controls
        preload="metadata"
        src={mediaSrc}
        aria-label={`Audio player for ${filename}`}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleError}
      />
    ) : (
      <video
        ref={videoRef}
        key={`${path}-${reloadVersion}`}
        className="media-preview-video"
        controls
        playsInline
        preload="metadata"
        src={mediaSrc}
        aria-label={`Video player for ${filename}`}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleError}
      />
    );

  return (
    <div
      data-pane
      className={
        isActive
          ? "media-preview-pane relative z-10 h-full"
          : "media-preview-pane absolute inset-0 invisible pointer-events-none"
      }
    >
      <div
        className={`media-preview-viewport ${kind === "video" ? "is-video" : "is-audio"}`}
        role="region"
        aria-label={`${kind === "audio" ? "Audio" : "Video"} preview for ${filename}`}
        aria-busy={status === "loading"}
      >
        {kind === "audio" ? (
          <div className="media-preview-card media-preview-audio-card">
            <div className="media-preview-heading">
              <span className="media-preview-badge">AUDIO</span>
              <div className="min-w-0">
                <div className="truncate text-[14px] text-[var(--text-secondary)]">{filename}</div>
                <div className="mt-1 text-[12px] text-[var(--text-muted)]">
                  {formatBytes(sizeBytes)} · system playback controls
                </div>
              </div>
            </div>
            {status === "error" ? <MediaError kind={kind} filename={filename} /> : media}
            {status === "loading" ? (
              <div className="media-preview-status" aria-live="polite">
                {loadingLabel(kind)}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="media-preview-video-layout">
            <div className="media-preview-video-frame">
              {status === "error" ? <MediaError kind={kind} filename={filename} /> : media}
              {status === "loading" ? (
                <div className="media-preview-video-status" aria-live="polite">
                  {loadingLabel(kind)}
                </div>
              ) : null}
            </div>
            <div className="media-preview-video-info">
              <span className="media-preview-badge">VIDEO</span>
              <span className="truncate">{filename}</span>
              <span className="text-[var(--text-muted)]">{formatBytes(sizeBytes)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
