"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";

/* eslint-disable @next/next/no-img-element */

/**
 * キャプション必須の画像ノード。
 * caption は alt 属性と <figcaption> の両方として公開側に出力される。
 */
export interface CaptionedImageAttrs {
  src: string;
  caption: string;
  width: number | null;
  height: number | null;
}

function CaptionedImageView({ node, updateAttributes, deleteNode, editor }: NodeViewProps) {
  const attrs = node.attrs as CaptionedImageAttrs;
  return (
    <NodeViewWrapper as="figure" className="my-4 rounded border border-gray-200 p-2">
      <img
        src={attrs.src}
        alt={attrs.caption}
        width={attrs.width ?? undefined}
        height={attrs.height ?? undefined}
        className="max-h-80 w-auto rounded"
      />
      <div className="mt-2 flex items-center gap-2">
        <input
          type="text"
          value={attrs.caption}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          placeholder="図版説明（必須）"
          className={`w-full rounded border px-2 py-1 text-sm ${
            attrs.caption.trim() ? "border-gray-300" : "border-red-400 bg-red-50"
          }`}
          disabled={!editor.isEditable}
        />
        <button
          type="button"
          onClick={() => deleteNode()}
          className="shrink-0 rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
        >
          ✕
        </button>
      </div>
    </NodeViewWrapper>
  );
}

export const CaptionedImage = Node.create({
  name: "captionedImage",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: "" },
      caption: { default: "" },
      width: { default: null },
      height: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "figure[data-captioned-image]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "figure",
      mergeAttributes(HTMLAttributes, { "data-captioned-image": "" }),
      [
        "img",
        {
          src: node.attrs.src,
          alt: node.attrs.caption,
          width: node.attrs.width,
          height: node.attrs.height,
        },
      ],
      ["figcaption", {}, node.attrs.caption],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CaptionedImageView);
  },
});
