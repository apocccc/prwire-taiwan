import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadata } from "@/lib/seo";
import { siteConfig, type Locale } from "../../../../config/site";

export const revalidate = 3600;

const LAST_UPDATED = "2026-07-17";

interface Section {
  heading: string;
  paragraphs: string[];
}

/**
 * 利用規約の雛形。
 * 第4〜6条は登録時の同意チェック項目（事例利用許諾・メディア一覧公開・
 * ダイレクト送付機能）に対応する必須条項。正式リリース前に法務レビューを行うこと。
 */
const CONTENT: Record<Locale, { intro: string; sections: Section[] }> = {
  zh: {
    intro:
      "本服務條款（以下稱「本條款」）規定使用者使用由株式會社APOC（APOC Wire，以下稱「營運方」）營運之新聞稿發布平台（以下稱「本服務」）之條件。註冊帳號即視為同意本條款之全部內容。",
    sections: [
      {
        heading: "第1條（適用）",
        paragraphs: [
          "本條款適用於使用者與營運方之間有關本服務使用之一切關係。",
        ],
      },
      {
        heading: "第2條（帳號註冊）",
        paragraphs: [
          "企業帳號得於註冊後發布新聞稿。媒體帳號須經營運方審核通過後，方可使用媒體專區功能。",
          "使用者應提供真實、正確之註冊資訊，並妥善保管帳號密碼。",
        ],
      },
      {
        heading: "第3條（新聞稿之發布與審核）",
        paragraphs: [
          "營運方得對發布申請進行審核，並得不附理由拒絕或要求修改。",
          "發布之內容由發布企業自行負責，不代表營運方之立場。",
        ],
      },
      {
        heading: "第4條（實績案例之使用許諾）",
        paragraphs: [
          "發布企業及註冊媒體均同意，營運方得將其名稱、標誌及使用事實，作為「使用企業」「使用媒體」「使用記者」之實績或案例，用於本服務及營運方之宣傳素材。",
        ],
      },
      {
        heading: "第5條（媒體資訊之公開）",
        paragraphs: [
          "註冊媒體同意其媒體名稱、媒體網址及報導領域刊登於本服務之公開媒體列表頁。",
          "個別聯絡方式（電子郵件、聯絡人姓名等）不予公開，僅供營運方與管理員使用。",
        ],
      },
      {
        heading: "第6條（直接送達功能）",
        paragraphs: [
          "使用者同意，於本服務將來提供「直接送達」功能時，發布企業得將新聞稿相關資訊直接送達至其指定之註冊媒體，註冊媒體並同意接收該等資訊。",
        ],
      },
      {
        heading: "第7條（禁止事項）",
        paragraphs: [
          "使用者不得發布違法、不實、侵害第三人權利或公序良俗之內容，不得為妨礙本服務營運之行為。",
        ],
      },
      {
        heading: "第8條（免責）",
        paragraphs: [
          "營運方就本服務之內容不提供任何明示或默示之保證，並得隨時變更、中止或終止本服務之全部或一部。",
        ],
      },
      {
        heading: "第9條（條款之變更）",
        paragraphs: [
          "營運方得於必要時修改本條款，修改後之條款自本頁面公告時起生效。",
        ],
      },
    ],
  },
  en: {
    intro:
      "These Terms of Service (the “Terms”) set out the conditions for using the press release distribution platform (the “Service”) operated by APOC Inc. (APOC Wire, the “Operator”). By registering an account, you agree to all of these Terms.",
    sections: [
      {
        heading: "Article 1 (Application)",
        paragraphs: [
          "These Terms apply to all relationships between users and the Operator concerning use of the Service.",
        ],
      },
      {
        heading: "Article 2 (Account Registration)",
        paragraphs: [
          "Company accounts may publish press releases upon registration. Media accounts require the Operator's approval before accessing the Media Room.",
          "Users shall provide accurate registration information and safeguard their credentials.",
        ],
      },
      {
        heading: "Article 3 (Publication and Review)",
        paragraphs: [
          "The Operator may review publication requests and may reject or request changes without stating reasons.",
          "Published content is the sole responsibility of the publishing company and does not represent the Operator's views.",
        ],
      },
      {
        heading: "Article 4 (Use as Case Studies)",
        paragraphs: [
          "Both publishing companies and registered media agree that the Operator may use their names, logos, and the fact of their use of the Service as client, media, or journalist case studies in promotional materials for the Service and the Operator.",
        ],
      },
      {
        heading: "Article 5 (Publication of Media Information)",
        paragraphs: [
          "Registered media agree that their outlet name, outlet URL, and coverage area will be listed on the Service's public media directory.",
          "Individual contact details (email addresses, contact person names, etc.) are never published and are used only by the Operator and administrators.",
        ],
      },
      {
        heading: "Article 6 (Direct Delivery Feature)",
        paragraphs: [
          "Users agree that, when the Service launches its direct delivery feature, publishing companies may deliver press release information directly to designated registered media, and registered media agree to receive such information.",
        ],
      },
      {
        heading: "Article 7 (Prohibited Conduct)",
        paragraphs: [
          "Users shall not publish unlawful, false, or infringing content, or content contrary to public order and morals, nor interfere with the operation of the Service.",
        ],
      },
      {
        heading: "Article 8 (Disclaimer)",
        paragraphs: [
          "The Operator provides the Service without warranties of any kind, express or implied, and may modify, suspend, or terminate all or part of the Service at any time.",
        ],
      },
      {
        heading: "Article 9 (Amendments)",
        paragraphs: [
          "The Operator may amend these Terms as necessary. Amended Terms take effect upon posting on this page.",
        ],
      },
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });
  return buildMetadata({
    locale: locale as Locale,
    path: "/terms",
    title: t("title"),
  });
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const t = await getTranslations("terms");
  const tNav = await getTranslations("nav");
  const content = CONTENT[l];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs
        locale={l}
        items={[{ name: tNav("home"), path: "/" }, { name: t("title") }]}
      />
      <article className="mt-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-sm text-gray-500">
          {t("updated")}: <time dateTime={LAST_UPDATED}>{LAST_UPDATED}</time>
          {" · "}
          {siteConfig.operator.companyName}（{siteConfig.operator.serviceBrand}）
        </p>
        <p className="mt-6 leading-relaxed text-gray-700">{content.intro}</p>
        {content.sections.map((s) => (
          <section key={s.heading} className="mt-8">
            <h2 className="text-lg font-semibold">{s.heading}</h2>
            {s.paragraphs.map((p, i) => (
              <p key={i} className="mt-2 leading-relaxed text-gray-700">
                {p}
              </p>
            ))}
          </section>
        ))}
      </article>
    </div>
  );
}
