import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { siteConfig, type Locale } from "../../../config/site";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
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
  const tFooter = await getTranslations("footer");
  const l = locale as Locale;

  return (
    <html lang={siteConfig.htmlLang[locale]}>
      <body className="antialiased min-h-screen flex flex-col bg-white text-gray-900">
        <NextIntlClientProvider>
        <header className="border-b border-gray-200">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
            <Link href="/" className="font-bold text-lg">
              {siteConfig.name[l]}
            </Link>
            <nav aria-label="Global">
              <ul className="flex items-center gap-4 text-sm">
                <li>
                  <Link href="/" className="hover:underline">
                    {t("home")}
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:underline">
                    {t("dashboard")}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 text-sm text-gray-600">
          <div className="mx-auto max-w-6xl px-4 py-6">
            <p>
              {tFooter("operatedBy")}
              {siteConfig.operator.companyName}（{siteConfig.operator.serviceBrand}）
            </p>
            <p className="mt-1">
              © {new Date().getFullYear()} {siteConfig.name[l]}
            </p>
          </div>
        </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
