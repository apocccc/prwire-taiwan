import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/require-role";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireRole(locale, ["ADMIN"]);
  const t = await getTranslations("admin");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <SignOutButton locale={locale} />
      </div>
      <p className="mt-4">{session.user.email}</p>
      <p className="mt-2 text-gray-600">{t("placeholder")}</p>
    </div>
  );
}
