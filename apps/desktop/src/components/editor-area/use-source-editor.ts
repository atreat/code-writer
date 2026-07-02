import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
  LanguageDescription,
} from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { search, searchKeymap } from "@codemirror/search";
import {
  Annotation,
  Compartment,
  EditorState,
  type Extension,
  Transaction,
} from "@codemirror/state";
import {
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { useCallback, useEffect, useRef } from "react";
import * as editorApi from "@/hooks/editor-api";
import { useFileLanguage, useReloadVersion } from "@/hooks/use-tabs";
import {
  baseSyntaxHighlights,
  baseTheme,
  generalSyntaxHighlights,
} from "@/lib/prosemark-core/syntaxHighlighting";

const sourceSync = Annotation.define<boolean>();

function sourceEditorExtensions(
  languageCompartment: Compartment,
  getPath: () => string,
  disposed: () => boolean,
): Extension[] {
  return [
    history(),
    drawSelection(),
    dropCursor(),
    lineNumbers(),
    foldGutter(),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    search({ literal: true }),
    baseSyntaxHighlights,
    generalSyntaxHighlights,
    baseTheme,
    languageCompartment.of([]),
    EditorView.updateListener.of((update) => {
      if (update.selectionSet && !disposed()) {
        editorApi.updateCursorPos(getPath(), update.state.selection.main.head);
      }
      if (!update.docChanged || disposed()) return;
      if (update.transactions.some((tr) => tr.annotation(sourceSync))) return;
      editorApi.updateContent(getPath(), update.state.doc.toString());
    }),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      indentWithTab,
    ]),
  ];
}

async function loadLanguageExtension(filePath: string, language: string | null) {
  const description =
    LanguageDescription.matchFilename(languages, filePath) ??
    languages.find((candidate) => candidate.name.toLowerCase() === language?.toLowerCase());
  if (!description) return [];
  try {
    return await description.load();
  } catch (error) {
    console.warn(`[source-editor] Failed to load language for ${filePath}:`, error);
    return [];
  }
}

export function useSourceEditor(filePath: string, autoFocus = false) {
  const viewRef = useRef<EditorView | null>(null);
  const disposedRef = useRef(false);
  const filePathRef = useRef(filePath);
  const autoFocusRef = useRef(autoFocus);
  const prevPathRef = useRef<string | null>(null);
  const prevReloadVersionRef = useRef(0);
  const languageCompartmentRef = useRef<Compartment | null>(null);
  if (!languageCompartmentRef.current) languageCompartmentRef.current = new Compartment();

  const reloadVersion = useReloadVersion(filePath);
  const language = useFileLanguage(filePath);

  filePathRef.current = filePath;
  autoFocusRef.current = autoFocus;

  const mountRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) {
      disposedRef.current = true;
      viewRef.current?.destroy();
      viewRef.current = null;
      return;
    }

    if (viewRef.current) return;
    disposedRef.current = false;

    const currentPath = filePathRef.current;
    const file = editorApi.getOpenFile(currentPath);
    const view = new EditorView({
      parent: el,
      state: EditorState.create({
        doc: file?.content ?? "",
        extensions: sourceEditorExtensions(
          languageCompartmentRef.current!,
          () => filePathRef.current,
          () => disposedRef.current,
        ),
      }),
    });

    viewRef.current = view;
    prevPathRef.current = currentPath;
    prevReloadVersionRef.current = file?.reloadVersion ?? 0;
    if (autoFocusRef.current) view.focus();
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || disposedRef.current) return;
    if (autoFocus) view.focus();
  }, [autoFocus]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || disposedRef.current) return;

    const pathChanged = filePath !== prevPathRef.current;
    const reloaded = !pathChanged && reloadVersion !== prevReloadVersionRef.current;
    if (!pathChanged && !reloaded) return;

    prevPathRef.current = filePath;
    prevReloadVersionRef.current = reloadVersion;

    const content = editorApi.getOpenFile(filePath)?.content ?? "";
    const cursorPos = Math.min(
      pathChanged
        ? (editorApi.getOpenFile(filePath)?.cursorPos ?? 0)
        : view.state.selection.main.head,
      content.length,
    );

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: content },
      selection: { anchor: cursorPos },
      annotations: [Transaction.addToHistory.of(false), sourceSync.of(true)],
      scrollIntoView: false,
    });
  }, [filePath, reloadVersion]);

  useEffect(() => {
    const view = viewRef.current;
    const compartment = languageCompartmentRef.current;
    if (!view || !compartment || disposedRef.current) return;

    let cancelled = false;
    void loadLanguageExtension(filePath, language).then((extension) => {
      if (cancelled || disposedRef.current || viewRef.current !== view) return;
      view.dispatch({ effects: compartment.reconfigure(extension) });
    });

    return () => {
      cancelled = true;
    };
  }, [filePath, language]);

  return mountRef;
}
