import { revalidatePath } from "next/cache";

/** リリースの公開状態変更時に関連ISRページを即時再生成する */
export function revalidateReleasePaths(slug: string) {
  for (const locale of ["zh", "en"]) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/news`);
    revalidatePath(`/${locale}/news/${slug}`);
  }
}
