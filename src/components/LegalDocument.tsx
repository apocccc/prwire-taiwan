import type { LegalBlock } from "@/data/legal-terms";
import { siteConfig } from "../../config/site";

/**
 * 利用規約・プライバシーポリシーの本文レンダラー。
 * 元の .docx（英語正文＋繁体字＋日本語参考訳）の構造をそのまま出力する。
 * 見出し(Article/條/条)は h2、それ以外は段落。
 */
export function LegalDocument({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <div className="legal-body mt-6">
      {blocks.map((b, i) =>
        b.t === "h" ? (
          <h2 key={i} className="mt-8 text-lg font-bold text-gray-900">
            {b.s}
          </h2>
        ) : (
          <p key={i} className="mt-2 leading-relaxed text-gray-700">
            {b.s}
          </p>
        )
      )}
    </div>
  );
}

/** 英語表記の運営者連絡先ブロック（全ページ共通） */
export function OperatorContact() {
  const op = siteConfig.operator;
  return (
    <address className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5 not-italic">
      <p className="font-semibold">{op.companyName}</p>
      <p className="mt-1 text-sm text-gray-600">
        <a href={`mailto:${op.email}`} className="text-blue-700 hover:underline">
          {op.email}
        </a>
      </p>
      <p className="mt-1 text-sm text-gray-600">{op.address}</p>
    </address>
  );
}
