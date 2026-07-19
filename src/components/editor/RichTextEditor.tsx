"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { useRef, type ReactNode } from "react";
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
  label: ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`rounded px-2 py-1 text-[15px] leading-none hover:text-[#d51f1a] ${
        active ? "font-bold text-[#d51f1a]" : "text-gray-700"
      }`}
    >
      {label}
    </button>
  );
}

/** 枠なしツールバーの区切り線 */
function ToolbarDivider() {
  return <span className="mx-1.5 h-5 w-px bg-gray-200" aria-hidden="true" />;
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
      Underline,
      CaptionedImage,
    ],
    content: initialContent ?? undefined,
    onUpdate({ editor }) {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class:
          "prose-body editor-content min-h-72 bg-white px-1 py-4 focus:outline-none",
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
      {/* 枠なしツールバー（下線のみ、参考デザイン準拠） */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 px-1 py-2">
        <ToolbarButton title="見出し1" label="H1" active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        <ToolbarButton title="見出し2" label="H2" active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
        <ToolbarButton title="見出し3" label="H3" active={editor.isActive("heading", { level: 4 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} />
        <ToolbarDivider />
        <ToolbarButton title="太字" label="B" active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()} />
        <ToolbarButton title="斜体" label={<span className="italic">I</span>} active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()} />
        <ToolbarButton title="下線" label={<span className="underline">U</span>} active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()} />
        <ToolbarButton title="取り消し線" label={<span className="line-through">S</span>} active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()} />
        <ToolbarDivider />
        <ToolbarButton title="番号リスト" label="1." active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <ToolbarButton title="箇条書き" label="•" active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <ToolbarDivider />
        <ToolbarButton title="引用" label="&ldquo;" active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        <ToolbarDivider />
        <ToolbarButton title="リンク" label="Link" active={editor.isActive("link")} onClick={setLink} />
        <ToolbarButton title="画像を挿入（キャプション必須）" label="IMG"
          onClick={() => fileInputRef.current?.click()} />
        <ToolbarDivider />
        <ToolbarButton title="書式をクリア" label="✕"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} />
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
