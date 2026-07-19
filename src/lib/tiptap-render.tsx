import type { ReactNode } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tiptap JSON → セマンティックHTML のサーバーサイドレンダラー。
 * クライアントJSに依存せず、公開記事ページで完全なHTMLを返すために使用。
 *
 * 対応ノード: paragraph / heading(h2-h4) / text(bold, italic, strike, code, link)
 * bulletList / orderedList / listItem / blockquote / horizontalRule / hardBreak
 * captionedImage(figure+figcaption, alt=caption) / table 系
 */

export interface TiptapNode {
  type?: string;
  text?: string;
  attrs?: Record<string, any>;
  marks?: { type: string; attrs?: Record<string, any> }[];
  content?: TiptapNode[];
}

function renderMarks(node: TiptapNode, key: number): ReactNode {
  let el: ReactNode = node.text ?? "";
  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case "bold":
        el = <strong>{el}</strong>;
        break;
      case "italic":
        el = <em>{el}</em>;
        break;
      case "strike":
        el = <s>{el}</s>;
        break;
      case "code":
        el = <code>{el}</code>;
        break;
      case "link": {
        const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "#";
        const safe = /^(https?:\/\/|\/|mailto:)/.test(href) ? href : "#";
        el = (
          <a href={safe} rel="nofollow noopener" target="_blank">
            {el}
          </a>
        );
        break;
      }
    }
  }
  return <span key={key}>{el}</span>;
}

function renderChildren(nodes?: TiptapNode[]): ReactNode {
  if (!nodes) return null;
  return nodes.map((n, i) => <RenderNode node={n} key={i} />);
}

function RenderNode({ node }: { node: TiptapNode }): ReactNode {
  switch (node.type) {
    case "doc":
      return renderChildren(node.content);
    case "paragraph":
      return <p>{renderChildren(node.content)}</p>;
    case "heading": {
      const level = Math.min(Math.max(Number(node.attrs?.level) || 2, 2), 4);
      const children = renderChildren(node.content);
      // h1 は記事タイトル専用のため、本文見出しは h2 以降に制限
      if (level === 2) return <h2>{children}</h2>;
      if (level === 3) return <h3>{children}</h3>;
      return <h4>{children}</h4>;
    }
    case "text":
      return renderMarks(node, 0);
    case "bulletList":
      return <ul>{renderChildren(node.content)}</ul>;
    case "orderedList":
      return <ol>{renderChildren(node.content)}</ol>;
    case "listItem":
      return <li>{renderChildren(node.content)}</li>;
    case "blockquote":
      return <blockquote>{renderChildren(node.content)}</blockquote>;
    case "horizontalRule":
      return <hr />;
    case "hardBreak":
      return <br />;
    case "captionedImage":
    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
      const caption =
        typeof node.attrs?.caption === "string"
          ? node.attrs.caption
          : typeof node.attrs?.alt === "string"
            ? node.attrs.alt
            : "";
      if (!src) return null;
      const width = Number(node.attrs?.width) || 1200;
      const height = Number(node.attrs?.height) || 675;
      const align = ["left", "center", "right"].includes(node.attrs?.align)
        ? node.attrs?.align
        : "center";
      const size = ["small", "medium", "large"].includes(node.attrs?.size)
        ? node.attrs?.size
        : "medium";
      return (
        <figure data-align={align} data-size={size}>
          {/* CLS防止のため width/height 必須、本文画像は遅延読み込み */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={caption} width={width} height={height} loading="lazy" decoding="async" />
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      );
    }
    case "table":
      return (
        <div className="overflow-x-auto">
          <table>
            <tbody>{renderChildren(node.content)}</tbody>
          </table>
        </div>
      );
    case "tableRow":
      return <tr>{renderChildren(node.content)}</tr>;
    case "tableHeader":
      return <th colSpan={Number(node.attrs?.colspan) || 1} rowSpan={Number(node.attrs?.rowspan) || 1}>{renderChildren(node.content)}</th>;
    case "tableCell":
      return <td colSpan={Number(node.attrs?.colspan) || 1} rowSpan={Number(node.attrs?.rowspan) || 1}>{renderChildren(node.content)}</td>;
    default:
      return renderChildren(node.content);
  }
}

export function TiptapContent({ doc }: { doc: unknown }) {
  if (!doc || typeof doc !== "object") return null;
  return <RenderNode node={doc as TiptapNode} />;
}

/** Tiptap JSON から平文テキストを抽出（meta description 自動生成用） */
export function tiptapToPlainText(doc: unknown): string {
  const parts: string[] = [];
  function walk(node: TiptapNode) {
    if (node.text) parts.push(node.text);
    for (const child of node.content ?? []) walk(child);
    if (["paragraph", "heading", "listItem"].includes(node.type ?? "")) {
      parts.push(" ");
    }
  }
  if (doc && typeof doc === "object") walk(doc as TiptapNode);
  return parts.join("").replace(/\s+/g, " ").trim();
}

/** 本文中の captionedImage ノードを列挙（バリデーション・画像同期用） */
export function collectBodyImages(
  doc: unknown
): { src: string; caption: string }[] {
  const images: { src: string; caption: string }[] = [];
  function walk(node: TiptapNode) {
    if (node.type === "captionedImage" || node.type === "image") {
      images.push({
        src: typeof node.attrs?.src === "string" ? node.attrs.src : "",
        caption:
          typeof node.attrs?.caption === "string"
            ? node.attrs.caption
            : typeof node.attrs?.alt === "string"
              ? node.attrs.alt
              : "",
      });
    }
    for (const child of node.content ?? []) walk(child);
  }
  if (doc && typeof doc === "object") walk(doc as TiptapNode);
  return images;
}
