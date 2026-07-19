import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import {
  AccountSettingsForm,
  type AccountInfo,
} from "@/components/dashboard/AccountSettingsForm";
import {
  MediaOutletForm,
  type MediaOutletInfo,
} from "@/components/dashboard/MediaOutletForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

export default async function MediaSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireRole(locale, ["MEDIA", "ADMIN"]);
  const t = await getTranslations("mediaRoom");
  const tAccount = await getTranslations("account");
  const tOutlet = await getTranslations("mediaOutletForm");

  const [user, outlet] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    }),
    prisma.mediaOutlet.findUnique({
      where: { userId: session.user.id },
      select: {
        outletName: true,
        outletUrl: true,
        contactName: true,
        contactTitle: true,
        contactEmail: true,
        contactPhone: true,
        coverageArea: true,
      },
    }),
  ]);
  if (!user) notFound();

  const accountInitial: AccountInfo = user;
  const outletInitial: MediaOutletInfo | null = outlet;

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-semibold">{t("accountSettings")}</h2>
        <p className="mt-1 text-sm text-gray-500">{tAccount("sectionNote")}</p>
        <div className="mt-4">
          <AccountSettingsForm initial={accountInitial} />
        </div>
      </section>

      {outletInitial && (
        <section>
          <h2 className="text-lg font-semibold">{tOutlet("title")}</h2>
          <p className="mt-1 text-sm text-gray-500">{tOutlet("note")}</p>
          <div className="mt-4">
            <MediaOutletForm initial={outletInitial} />
          </div>
        </section>
      )}
    </div>
  );
}
