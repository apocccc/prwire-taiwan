import { revalidatePath } from "next/cache";

/**
 * リリースの公開状態変更時に関連ISRページを即時再生成する。
 * URLが {記事seq}.{会社seq}.html 形式のため、記事詳細は動的ルート単位で再生成する。
 */
export function revalidateReleasePaths() {
  for (const locale of ["zh", "en"]) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/news`);
    revalidatePath(`/${locale}/news/[slug]`, "page");
  }
}
