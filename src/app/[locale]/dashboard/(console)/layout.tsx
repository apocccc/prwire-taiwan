import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { SignOutButton } from "@/components/SignOutButton";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { pick } from "@/lib/l10n";
import type { Locale } from "../../../../../config/site";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireRole(locale, ["PUBLISHER", "ADMIN"]);
  const t = await getTranslations("dashboard");
  const l = locale as Locale;

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    select: { nameZh: true, nameEn: true },
  });

  const items = [
    { href: "/dashboard", label: t("myReleases") },
    { href: "/dashboard/analytics", label: t("analytics") },
    { href: "/dashboard/media", label: t("mediaActivity") },
    { href: "/dashboard/settings", label: t("settings") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {company ? pick(l, company.nameZh, company.nameEn) : session.user.email}
          </p>
        </div>
        <SignOutButton locale={locale} />
      </div>
      <div className="flex flex-col gap-8 md:flex-row">
        <aside className="w-full shrink-0 md:w-56">
          <DashboardSidebar items={items} locale={locale} />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
