import { getTranslations } from "next-intl/server";
import { signOut } from "@/auth";

export async function SignOutButton({ locale }: { locale: string }) {
  const t = await getTranslations("common");

  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: `/${locale}/login` });
      }}
    >
      <button
        type="submit"
        className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        {t("logout")}
      </button>
    </form>
  );
}
