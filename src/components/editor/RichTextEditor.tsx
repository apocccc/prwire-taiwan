"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { useRef } from "react";
import { CaptionedImage } from "./CaptionedImage";

const MAX_BODY_IMAGES = 10;

function countImages(doc: JSONContent | undefined): number {
  let count = 0;
  function walk(node: JSONContent) {
    if (node.type === "captionedImage") count++;
    for (const child of node.content ?? []) walk(child);
  }
  if (doc) walk(doc);
  return count;
}

function ToolbarButton({
  onClick,
  active,
  label,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`rounded px-2 py-1 text-sm ${
        active ? "bg-gray-900 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}

export function RichTextEditor({
  initialContent,
  onChange,
  placeholder,
}: {
  initialContent: JSONContent | null;
  onChange: (json: JSONContent) => void;
  placeholder?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false },
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      CaptionedImage,
    ],
    content: initialContent ?? undefined,
    onUpdate({ editor }) {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class:
          "prose-body min-h-72 rounded-b border border-gray-300 bg-white px-4 py-3 focus:outline-none",
        "data-placeholder": placeholder ?? "",
      },
    },
  });

  if (!editor) {
    return <div className="min-h-72 rounded border border-gray-200 bg-gray-50" />;
  }

  async function uploadAndInsertImage(file: File) {
    if (!editor) return;
    if (countImages(editor.getJSON()) >= MAX_BODY_IMAGES) {
      alert(`本文中の画像は最大 ${MAX_BODY_IMAGES} 枚までです`);
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/uploads/image", { method: "POST", body: fd });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      alert(`画像のアップロードに失敗しました (${body?.error ?? res.status})`);
      return;
    }
    const { url, width, height } = await res.json();
    editor
      .chain()
      .focus()
      .insertContent({
        type: "captionedImage",
        attrs: { src: url, caption: "", width, height },
      })
      .run();
  }

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("リンクURL（httpsから入力）", prev ?? "https://");
    if (url === null) return;
    if (url === "" || url === "https://") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    if (!/^https?:\/\//.test(url)) {
      alert("http:// または https:// で始まるURLを入力してください");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 rounded-t border border-b-0 border-gray-300 bg-gray-50 px-2 py-1.5">
        <ToolbarButton title="見出し2" label="H2" active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        <ToolbarButton title="見出し3" label="H3" active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
        <span className="mx-1 h-5 w-px bg-gray-300" />
        <ToolbarButton title="太字" label="B" active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()} />
        <ToolbarButton title="斜体" label="I" active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()} />
        <ToolbarButton title="取り消し線" label="S" active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()} />
        <span className="mx-1 h-5 w-px bg-gray-300" />
        <ToolbarButton title="リンク" label="🔗" active={editor.isActive("link")} onClick={setLink} />
        <ToolbarButton title="引用" label="❝" active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        <ToolbarButton title="箇条書き" label="•―" active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <ToolbarButton title="番号リスト" label="1." active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <span className="mx-1 h-5 w-px bg-gray-300" />
        <ToolbarButton title="画像を挿入（キャプション必須）" label="🖼"
          onClick={() => fileInputRef.current?.click()} />
        <ToolbarButton title="表を挿入" label="⊞"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
        {editor.isActive("table") && (
          <>
            <ToolbarButton title="行を追加" label="+行"
              onClick={() => editor.chain().focus().addRowAfter().run()} />
            <ToolbarButton title="列を追加" label="+列"
              onClick={() => editor.chain().focus().addColumnAfter().run()} />
            <ToolbarButton title="表を削除" label="⊟"
              onClick={() => editor.chain().focus().deleteTable().run()} />
          </>
        )}
        <ToolbarButton title="区切り線" label="―"
          onClick={() => editor.chain().focus().setHorizontalRule().run()} />
        <span className="mx-1 h-5 w-px bg-gray-300" />
        <ToolbarButton title="元に戻す" label="↩"
          onClick={() => editor.chain().focus().undo().run()} />
        <ToolbarButton title="やり直す" label="↪"
          onClick={() => editor.chain().focus().redo().run()} />
      </div>
      <EditorContent editor={editor} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadAndInsertImage(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
