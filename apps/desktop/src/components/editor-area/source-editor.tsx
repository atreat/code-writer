import { useSourceEditor } from "./use-source-editor";
import { ProgressiveBlur } from "./editor-scroll-container";
import "./source-editor.css";

interface SourceEditorProps {
  filePath: string;
  autoFocus?: boolean;
}

export function SourceEditor({ filePath, autoFocus }: SourceEditorProps) {
  const editorRef = useSourceEditor(filePath, autoFocus ?? false);
  return <div ref={editorRef} className="h-full" />;
}

interface SourceEditorPaneProps {
  path: string;
  isActive: boolean;
}

export function SourceEditorPane({ path, isActive }: SourceEditorPaneProps) {
  return (
    <div
      data-pane
      className={
        isActive
          ? "source-editor-pane relative z-10 h-full"
          : "source-editor-pane absolute inset-0 invisible pointer-events-none"
      }
    >
      <SourceEditor filePath={path} autoFocus={isActive} />
      <ProgressiveBlur position="top" />
    </div>
  );
}
