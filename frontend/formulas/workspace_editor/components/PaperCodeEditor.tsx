import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { StreamLanguage, defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { searchKeymap } from "@codemirror/search";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { stex } from "@codemirror/legacy-modes/mode/stex";
import { useEffect, useRef } from "react";

type PaperCodeEditorProps = {
  content: string;
  onChange: (content: string) => void;
};

export function PaperCodeEditor({ content, onChange }: PaperCodeEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onChange);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const target = editorRef.current;
    if (!target) {
      return undefined;
    }

    const view = new EditorView({
      parent: target,
      state: EditorState.create({
        doc: content,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          history(),
          drawSelection(),
          StreamLanguage.define(stex),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          highlightActiveLine(),
          EditorView.lineWrapping,
          keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
        ],
      }),
    });

    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }
    const currentContent = view.state.doc.toString();
    if (currentContent === content) {
      return;
    }
    view.dispatch({
      changes: {
        from: 0,
        insert: content,
        to: currentContent.length,
      },
    });
  }, [content]);

  return (
    <div
      aria-label="Paper source editor"
      className="workspace-code-editor"
      data-editor-engine="codemirror"
      ref={editorRef}
    />
  );
}
