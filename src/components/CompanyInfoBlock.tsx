import { getTranslations } from "next-intl/server";

export interface CompanyInfo {
  address: string | null;
  representativeName: string | null;
  capital: string | null;
  websiteUrl: string | null;
  snsX: string | null;
  snsFacebook: string | null;
  snsInstagram: string | null;
  snsLine: string | null;
  snsYoutube: string | null;
  snsLinkedin: string | null;
}

/**
 * プレスリリース／企業ページに掲載する会社基本情報。
 * 値のある項目のみ表示する。
 */
export async function CompanyInfoBlock({ company }: { company: CompanyInfo }) {
  const t = await getTranslations("companyInfo");

  const rows: { label: string; value: React.ReactNode }[] = [];
  if (company.representativeName) {
    rows.push({ label: t("representative"), value: company.representativeName });
  }
  if (company.capital) {
    rows.push({ label: t("capital"), value: company.capital });
  }
  if (company.address) {
    rows.push({ label: t("address"), value: company.address });
  }
  if (company.websiteUrl) {
    rows.push({
      label: t("website"),
      value: (
        <a
          href={company.websiteUrl}
          target="_blank"
          rel="noopener nofollow"
          className="text-blue-700 hover:underline"
        >
          {company.websiteUrl}
        </a>
      ),
    });
  }

  const sns = (
    [
      ["X", company.snsX],
      ["Facebook", company.snsFacebook],
      ["Instagram", company.snsInstagram],
      ["LINE", company.snsLine],
      ["YouTube", company.snsYoutube],
      ["LinkedIn", company.snsLinkedin],
    ] as const
  ).filter(([, url]) => url);

  if (rows.length === 0 && sns.length === 0) return null;

  return (
    <div className="mt-4 text-sm">
      {rows.length > 0 && (
        <dl className="space-y-1.5">
          {rows.map((r, i) => (
            <div key={i} className="flex gap-3">
              <dt className="w-20 shrink-0 text-gray-500">{r.label}</dt>
              <dd className="min-w-0 break-words text-gray-800">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {sns.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {sns.map(([label, url]) => (
            <a
              key={label}
              href={url as string}
              target="_blank"
              rel="noopener nofollow"
              className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:border-[#d51f1a] hover:text-[#d51f1a]"
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
