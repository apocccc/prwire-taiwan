"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";

/* eslint-disable @next/next/no-img-element */

/**
 * キャプション必須の画像ノード。
 * caption は alt 属性と <figcaption> の両方として公開側に出力される。
 * align（left/center/right）と size（small/medium/large）で配置と表示幅を指定でき、
 * 既定は中央揃え・中サイズ。表示は常に元画像の縦横比を保つ（height:auto）。
 */
export type ImageAlign = "left" | "center" | "right";
export type ImageSize = "small" | "medium" | "large";

export interface CaptionedImageAttrs {
  src: string;
  caption: string;
  width: number | null;
  height: number | null;
  align: ImageAlign;
  size: ImageSize;
}

const ALIGN_OPTIONS: { value: ImageAlign; label: string }[] = [
  { value: "left", label: "左" },
  { value: "center", label: "中央" },
  { value: "right", label: "右" },
];
const SIZE_OPTIONS: { value: ImageSize; label: string }[] = [
  { value: "small", label: "小" },
  { value: "medium", label: "中" },
  { value: "large", label: "大" },
];

function CaptionedImageView({ node, updateAttributes, deleteNode, editor }: NodeViewProps) {
  const attrs = node.attrs as CaptionedImageAttrs;
  const editable = editor.isEditable;

  return (
    <NodeViewWrapper
      as="figure"
      data-align={attrs.align}
      data-size={attrs.size}
      className="prose-image my-4"
    >
      {editable && (
        <div
          className="mb-2 flex flex-wrap items-center gap-3 text-xs"
          contentEditable={false}
        >
          <div className="flex items-center gap-1">
            {ALIGN_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => updateAttributes({ align: o.value })}
                className={`rounded px-2 py-0.5 ${
                  attrs.align === o.value
                    ? "bg-[#d51f1a] text-white"
                    : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {SIZE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => updateAttributes({ size: o.value })}
                className={`rounded px-2 py-0.5 ${
                  attrs.size === o.value
                    ? "bg-gray-900 text-white"
                    : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <img
        src={attrs.src}
        alt={attrs.caption}
        width={attrs.width ?? undefined}
        height={attrs.height ?? undefined}
        className="h-auto w-full rounded"
        draggable={false}
      />

      <div className="mt-2 flex items-center gap-2" contentEditable={false}>
        <input
          type="text"
          value={attrs.caption}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          placeholder="図版説明（必須）"
          className={`w-full rounded border px-2 py-1 text-sm ${
            attrs.caption.trim() ? "border-gray-300" : "border-red-400 bg-red-50"
          }`}
          disabled={!editable}
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
      align: {
        default: "center",
        parseHTML: (el) => el.getAttribute("data-align") || "center",
      },
      size: {
        default: "medium",
        parseHTML: (el) => el.getAttribute("data-size") || "medium",
      },
    };
  },

  parseHTML() {
    return [{ tag: "figure[data-captioned-image]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "figure",
      mergeAttributes(HTMLAttributes, {
        "data-captioned-image": "",
        "data-align": node.attrs.align,
        "data-size": node.attrs.size,
      }),
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
