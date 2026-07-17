/**
 * 記事URLのパス生成・解析（PR TIMES風）。
 * 形式: {記事seq(9桁ゼロ埋め)}.{会社seq(9桁ゼロ埋め)}.html
 * 例: 000000042.000000012.html → /{locale}/news/000000042.000000012.html
 */

function pad9(n: number): string {
  return String(n).padStart(9, "0");
}

/** 記事の公開URLパス（ロケールを除いた部分、例: "/news/000000042.000000012.html"） */
export function articlePath(release: {
  seq: number;
  company: { seq: number };
}): string {
  return `/news/${pad9(release.seq)}.${pad9(release.company.seq)}.html`;
}

/** ルートパラメータ（[slug]）から記事seq・会社seqを取り出す。数値形式でなければ null */
export function parseArticleParam(
  param: string
): { releaseSeq: number; companySeq: number } | null {
  const m = param.match(/^(\d{1,15})\.(\d{1,15})(?:\.html)?$/);
  if (!m) return null;
  const releaseSeq = parseInt(m[1], 10);
  const companySeq = parseInt(m[2], 10);
  if (!Number.isFinite(releaseSeq) || !Number.isFinite(companySeq)) return null;
  return { releaseSeq, companySeq };
}
