export type WorkspaceEntryKind =
  | "directory"
  | "markdown"
  | "sourceText"
  | "image"
  | "audio"
  | "video"
  | "unsupported"
  | "tooLarge"
  | "binary";

export const IMAGE_FILE_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "bmp",
  "tif",
  "tiff",
  "avif",
] as const;

export const AUDIO_FILE_EXTENSIONS = [
  "aac",
  "aif",
  "aiff",
  "flac",
  "m4a",
  "mp3",
  "oga",
  "ogg",
  "opus",
  "wav",
] as const;

export const VIDEO_FILE_EXTENSIONS = ["avi", "m4v", "mkv", "mov", "mp4", "ogv", "webm"] as const;
export type LineEnding = "lf" | "crlf" | "mixed" | "none";

export interface DirEntry {
  name: string;
  path: string;
  is_dir: boolean;
  is_markdown: boolean;
  kind: WorkspaceEntryKind;
  modified_at: number;
  title: string | null;
  language: string | null;
  size_bytes: number | null;
}

export interface FileContent {
  path: string;
  content: string;
  modified_at: number;
  kind: WorkspaceEntryKind;
  language: string | null;
  size_bytes: number;
  line_ending?: LineEnding;
  is_read_only?: boolean;
}

export interface WriteResult {
  path: string;
  modified_at: number;
}

export function isOpenableFileKind(kind: WorkspaceEntryKind): boolean {
  return kind === "markdown" || kind === "sourceText" || isMediaFileKind(kind);
}

export function isMediaFileKind(kind: WorkspaceEntryKind): boolean {
  return kind === "image" || kind === "audio" || kind === "video";
}

export interface WorkspaceInfo {
  root: string;
  name: string;
  file_count: number;
  epoch: number;
}

export interface SearchResult {
  path: string;
  filename: string;
  relative_path: string;
  score: number;
  match_indices: number[];
}

export interface ContentSearchResult {
  path: string;
  line_number: number;
  line_content: string;
  match_ranges: [number, number][];
}

export interface IndexStats {
  file_count: number;
  duration_ms: number;
}
