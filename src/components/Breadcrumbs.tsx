import { Link } from "@/i18n/navigation";
import { JsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { siteConfig, type Locale } from "../../config/site";

export interface Crumb {
  name: string;
  /** ロケールを除いたパス（例: "/news"）。最後の要素は省略可 */
  path?: string;
}

/** 全記事・全一覧ページ共通のパンくずリスト（BreadcrumbList JSON-LD 同時出力） */
export function Breadcrumbs({ locale, items }: { locale: Locale; items: Crumb[] }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(
          items.map((c) => ({
            name: c.name,
            url: c.path
              ? `${siteConfig.url}/${locale}${c.path === "/" ? "" : c.path}`
              : undefined,
          }))
        )}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((c, i) => (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true">/</span>}
              {c.path ? (
                <Link href={c.path} className="hover:underline">
                  {c.name}
                </Link>
              ) : (
                <span aria-current="page" className="text-gray-700">
                  {c.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
