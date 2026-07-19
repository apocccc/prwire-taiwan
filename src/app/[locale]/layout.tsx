import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { HeaderAuthNav } from "@/components/HeaderAuthNav";
import { getSiteSettings } from "@/lib/site-settings";
import { siteConfig, type Locale } from "../../../config/site";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = (hasLocale(routing.locales, locale) ? locale : routing.defaultLocale) as Locale;
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: siteConfig.name[l],
      template: `%s | ${siteConfig.name[l]}`,
    },
    description: siteConfig.description[l],
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("nav");
  const tCommon = await getTranslations("common");
  const tFooter = await getTranslations("footer");
  const l = locale as Locale;
  const settings = await getSiteSettings();

  return (
    <html lang={siteConfig.htmlLang[locale]}>
      <body className="antialiased min-h-screen flex flex-col bg-white text-gray-900">
        <NextIntlClientProvider>
          <header className="border-b border-gray-200">
            <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
              <Link href="/" className="shrink-0" aria-label={settings.name[l]}>
                <Image
                  src="/logo.png"
                  alt={settings.name[l]}
                  width={1500}
                  height={300}
                  priority
                  className="h-9 w-auto sm:h-10"
                />
              </Link>
              <nav
                aria-label="Global"
                className="flex flex-wrap items-center justify-end gap-2 sm:gap-3"
              >
                <HeaderAuthNav
                  locale={locale}
                  labels={{
                    freeDistribute: t("freeDistribute"),
                    companyLogin: t("companyLogin"),
                    mediaLogin: t("mediaLogin"),
                    dashboard: t("dashboard"),
                    mediaRoom: t("mediaRoom"),
                    logout: tCommon("logout"),
                  }}
                />
                <LocaleSwitcher />
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-gray-200 text-sm text-gray-600">
            <div className="mx-auto max-w-6xl px-4 py-6">
              <nav aria-label="Footer">
                <ul className="flex flex-wrap gap-4">
                  <li>
                    <Link href="/news" className="hover:underline">
                      {t("news")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/media" className="hover:underline">
                      {t("mediaList")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="hover:underline">
                      {t("terms")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="hover:underline">
                      {t("privacy")}
                    </Link>
                  </li>
                </ul>
              </nav>
              {settings.footerText[l] && <p className="mt-4">{settings.footerText[l]}</p>}
              <address className="mt-4 not-italic">
                <p>
                  {tFooter("operatedBy")}
                  {siteConfig.operator.companyName}
                </p>
                <p className="mt-1">
                  <a
                    href={`mailto:${siteConfig.operator.email}`}
                    className="hover:underline"
                  >
                    {siteConfig.operator.email}
                  </a>
                </p>
                <p className="mt-1">{siteConfig.operator.address}</p>
              </address>
              <p className="mt-1">
                © {new Date().getFullYear()} {settings.name[l]}
              </p>
            </div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
