import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/require-role";
import { SignOutButton } from "@/components/SignOutButton";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export const dynamic = "force-dynamic";

export default async function MediaConsoleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, ["MEDIA", "ADMIN"]);
  const t = await getTranslations("mediaRoom");

  const items = [
    { href: "/media-room", label: t("latestReleases") },
    { href: "/media-room/favorites", label: t("favorites") },
    { href: "/media-room/following", label: t("followingCompanies") },
    { href: "/media-room/settings", label: t("settings") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
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
