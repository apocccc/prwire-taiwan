import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import {
  CompanyProfileForm,
  type CompanyProfile,
} from "@/components/dashboard/CompanyProfileForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

/** 事業者の会社プロフィール編集（ロゴ設定） */
export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireRole(locale, ["PUBLISHER", "ADMIN"]);
  const t = await getTranslations("companyProfile");

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    select: {
      nameZh: true,
      nameEn: true,
      descriptionZh: true,
      descriptionEn: true,
      websiteUrl: true,
      logoUrl: true,
    },
  });
  if (!company) notFound();

  const initial: CompanyProfile = company;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <div className="mt-6">
        <CompanyProfileForm initial={initial} />
      </div>
    </div>
  );
}
