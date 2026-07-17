import type { Metadata } from "next";
import { Suspense } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LoginForm } from "./LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold">{t("loginTitle")}</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
      <div className="mt-8 border-t border-gray-200 pt-6 text-sm">
        <p className="text-gray-600">{t("noAccount")}</p>
        <ul className="mt-2 space-y-1">
          <li>
            <Link href="/register/publisher" className="text-blue-700 hover:underline">
              {t("registerPublisher")}
            </Link>
          </li>
          <li>
            <Link href="/register/media" className="text-blue-700 hover:underline">
              {t("registerMedia")}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
