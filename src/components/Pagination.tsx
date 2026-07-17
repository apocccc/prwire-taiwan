import { Link } from "@/i18n/navigation";

/**
 * /page/2 形式のHTMLリンクによるページネーション（?page= は使わない）。
 * basePath: ロケールを除いたパス（例: "/news"）。1ページ目は basePath 自身。
 */
export function Pagination({
  basePath,
  currentPage,
  totalPages,
}: {
  basePath: string;
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const pageHref = (p: number) => (p === 1 ? basePath : `${basePath}/page/${p}`);
  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <nav aria-label="Pagination" className="mt-10">
      <ul className="flex items-center justify-center gap-2 text-sm">
        {currentPage > 1 && (
          <li>
            <Link
              href={pageHref(currentPage - 1)}
              rel="prev"
              className="rounded border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
            >
              ←
            </Link>
          </li>
        )}
        {start > 1 && (
          <li>
            <Link href={pageHref(1)} className="rounded border border-gray-300 px-3 py-1.5 hover:bg-gray-50">
              1
            </Link>
          </li>
        )}
        {start > 2 && <li className="px-1 text-gray-400">…</li>}
        {pages.map((p) => (
          <li key={p}>
            {p === currentPage ? (
              <span aria-current="page" className="rounded bg-gray-900 px-3 py-1.5 font-medium text-white">
                {p}
              </span>
            ) : (
              <Link href={pageHref(p)} className="rounded border border-gray-300 px-3 py-1.5 hover:bg-gray-50">
                {p}
              </Link>
            )}
          </li>
        ))}
        {end < totalPages - 1 && <li className="px-1 text-gray-400">…</li>}
        {end < totalPages && (
          <li>
            <Link href={pageHref(totalPages)} className="rounded border border-gray-300 px-3 py-1.5 hover:bg-gray-50">
              {totalPages}
            </Link>
          </li>
        )}
        {currentPage < totalPages && (
          <li>
            <Link
              href={pageHref(currentPage + 1)}
              rel="next"
              className="rounded border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
            >
              →
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
