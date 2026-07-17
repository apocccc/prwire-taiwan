import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireRole } from "@/lib/require-role";
import { SignOutButton } from "@/components/SignOutButton";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, ["ADMIN"]);
  const t = await getTranslations("adminPanel");

  const nav = [
    { href: "/admin", label: t("reviewQueue") },
    { href: "/admin/releases", label: t("releases") },
    { href: "/admin/users", label: t("users") },
    { href: "/admin/categories", label: t("categoriesAdmin") },
    { href: "/admin/settings", label: t("settings") },
    { href: "/admin/analytics", label: t("analytics") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <SignOutButton locale={locale} />
      </div>
      <nav className="mt-6 border-b border-gray-200">
        <ul className="flex flex-wrap gap-1">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-block rounded-t px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
