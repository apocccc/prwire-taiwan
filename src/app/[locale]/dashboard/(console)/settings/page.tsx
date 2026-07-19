import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import {
  CompanyProfileForm,
  type CompanyProfile,
} from "@/components/dashboard/CompanyProfileForm";
import {
  AccountSettingsForm,
  type AccountInfo,
} from "@/components/dashboard/AccountSettingsForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireRole(locale, ["PUBLISHER", "ADMIN"]);
  const t = await getTranslations("dashboard");
  const tAccount = await getTranslations("account");
  const tCompany = await getTranslations("companyProfile");

  const [user, company] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    }),
    prisma.company.findUnique({
      where: { userId: session.user.id },
      select: {
        nameZh: true,
        nameEn: true,
        descriptionZh: true,
        descriptionEn: true,
        websiteUrl: true,
        logoUrl: true,
        address: true,
        representativeName: true,
        capital: true,
        snsX: true,
        snsFacebook: true,
        snsInstagram: true,
        snsLine: true,
        snsYoutube: true,
        snsLinkedin: true,
      },
    }),
  ]);
  if (!user) notFound();

  const accountInitial: AccountInfo = user;
  const companyInitial: CompanyProfile | null = company;

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-semibold">{t("accountSettings")}</h2>
        <p className="mt-1 text-sm text-gray-500">{tAccount("sectionNote")}</p>
        <div className="mt-4">
          <AccountSettingsForm initial={accountInitial} />
        </div>
      </section>

      {companyInitial && (
        <section>
          <h2 className="text-lg font-semibold">{tCompany("title")}</h2>
          <div className="mt-4">
            <CompanyProfileForm initial={companyInitial} />
          </div>
        </section>
      )}
    </div>
  );
}
