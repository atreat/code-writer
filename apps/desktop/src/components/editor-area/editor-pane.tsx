import type { EditorView } from "@codemirror/view";
import { ProseMarkEditor } from "./prosemark-editor";
import { FrontmatterPanel } from "./frontmatter-panel";
import { EditorScrollContainer } from "./editor-scroll-container";
import { EditorSearchOverview } from "./editor-search-overview";
import { SectionRail } from "./section-rail";
import { useCloseEditorSearchWhenInactive } from "./use-close-editor-search-when-inactive";
import { useEditorSettingsRef } from "./use-editor-settings";
import {
  useFileKind,
  useFileUnavailableReason,
  useHasExternalConflict,
  useIsFileLoading,
} from "@/hooks/use-tabs";
import * as editorApi from "@/hooks/editor-api";
import { lazy, memo, Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { WorkspaceEntryKind } from "@/types/fs";

const SourceEditorPane = lazy(() =>
  import("./source-editor").then((module) => ({ default: module.SourceEditorPane })),
);

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function AsciiSpinner() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % SPINNER_FRAMES.length), 80);
    return () => clearInterval(id);
  }, []);
  return <span>{SPINNER_FRAMES[frame]}</span>;
}

function unavailableLabel(kind: WorkspaceEntryKind) {
  if (kind === "tooLarge") return "File too large";
  if (kind === "binary") return "Binary file";
  return "Unsupported file";
}

function filename(path: string) {
  return path.slice(path.lastIndexOf("/") + 1) || path;
}

function FileUnavailablePane({
  path,
  kind,
  isActive,
}: {
  path: string;
  kind: WorkspaceEntryKind;
  isActive: boolean;
}) {
  const reason = useFileUnavailableReason(path);

  return (
    <div
      data-pane
      className={
        isActive ? "relative z-10 h-full" : "absolute inset-0 invisible pointer-events-none"
      }
    >
      <ExternalConflictBanner path={path} />
      <div className="flex h-full items-center justify-center px-8 text-center">
        <div className="max-w-md">
          <div className="text-[13px] font-medium text-[var(--text-secondary)]">
            {filename(path)}
          </div>
          <div className="mt-2 text-[13px] text-[var(--text-muted)]">{unavailableLabel(kind)}</div>
          {reason ? (
            <div className="mt-4 break-words text-[12px] leading-5 text-[var(--text-muted)]">
              {reason}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ExternalConflictBanner({ path }: { path: string }) {
  const hasConflict = useHasExternalConflict(path);
  if (!hasConflict) return null;

  return (
    <div className="absolute top-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-[8px] border border-[var(--line-subtle)] bg-[var(--surface-card)] px-3 py-2 text-[13px] text-[var(--text-secondary)] shadow-sm">
      <span>This file changed on disk.</span>
      <button
        type="button"
        onClick={() => editorApi.reloadExternalVersion(path)}
        className="rounded-[6px] px-2 py-1 text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
      >
        Reload from Disk
      </button>
      <button
        type="button"
        onClick={() => editorApi.keepLocalVersion(path)}
        className="rounded-[6px] px-2 py-1 text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
      >
        Keep My Version
      </button>
    </div>
  );
}

interface EditorPaneProps {
  path: string;
  isActive: boolean;
}

export const EditorPane = memo(function EditorPane({ path, isActive }: EditorPaneProps) {
  const isLoading = useIsFileLoading(path);
  const fileKind = useFileKind(path);
  const editorSettingsRef = useEditorSettingsRef();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  useCloseEditorSearchWhenInactive(isActive);

  const getScrollContainer = useCallback(() => scrollContainerRef.current, []);

  if (isLoading) {
    return (
      <div
        className={
          isActive ? "relative z-10 h-full" : "absolute inset-0 invisible pointer-events-none"
        }
      >
        <div className="flex h-full items-center justify-center text-[13px] text-[var(--text-muted)]">
          <AsciiSpinner />
        </div>
      </div>
    );
  }

  if (fileKind === "sourceText") {
    return (
      <Suspense
        fallback={
          <div
            className={
              isActive ? "relative z-10 h-full" : "absolute inset-0 invisible pointer-events-none"
            }
          >
            <div className="flex h-full items-center justify-center text-[13px] text-[var(--text-muted)]">
              <AsciiSpinner />
            </div>
          </div>
        }
      >
        <ExternalConflictBanner path={path} />
        <SourceEditorPane path={path} isActive={isActive} />
      </Suspense>
    );
  }

  if (fileKind === "unsupported" || fileKind === "tooLarge" || fileKind === "binary") {
    return <FileUnavailablePane path={path} kind={fileKind} isActive={isActive} />;
  }

  return (
    <div
      data-pane
      className={
        isActive ? "relative z-10 h-full" : "absolute inset-0 invisible pointer-events-none"
      }
    >
      <ExternalConflictBanner path={path} />
      <EditorScrollContainer ref={scrollContainerRef}>
        <div
          className="mx-auto w-full pt-32 pb-6 md:pt-[9rem]"
          style={{
            maxWidth: "var(--writer-editor-outer-width)",
            boxSizing: "border-box",
            paddingLeft: "var(--writer-editor-side-padding)",
            paddingRight: "var(--writer-editor-side-padding)",
          }}
        >
          <FrontmatterPanel filePath={path} />
        </div>
        <div ref={editorSettingsRef}>
          <ProseMarkEditor
            filePath={path}
            getScrollContainer={getScrollContainer}
            autoFocus={isActive}
            onViewChange={setEditorView}
          />
        </div>
      </EditorScrollContainer>
      <SectionRail filePath={path} view={editorView} scrollContainerRef={scrollContainerRef} />
      {isActive && <EditorSearchOverview scrollContainerRef={scrollContainerRef} />}
    </div>
  );
});
