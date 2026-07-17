import { z } from "zod";

/**
 * 登録時の同意チェック（利用規約 §事例利用・§メディア一覧公開・§ダイレクト送付）
 * 事業者・メディア共通で全項目必須。
 */
const consentSchema = z.object({
  consentTerms: z.literal(true),
  consentPrivacy: z.literal(true),
});

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const publisherRegisterSchema = credentialsSchema
  .merge(consentSchema)
  .extend({
    type: z.literal("publisher"),
    companyNameZh: z.string().min(1).max(200),
    companyNameEn: z.string().max(200).optional().or(z.literal("")),
    companySlug: z
      .string()
      .min(2)
      .max(50)
      .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/),
    websiteUrl: z.string().url().max(500).optional().or(z.literal("")),
  });

export const mediaRegisterSchema = credentialsSchema
  .merge(consentSchema)
  .extend({
    type: z.literal("media"),
    outletName: z.string().min(1).max(200),
    outletUrl: z.string().url().max(500),
    contactName: z.string().min(1).max(100),
    contactEmail: z.string().email().max(320),
    coverageArea: z.string().min(1).max(500),
  });

export const registerSchema = z.discriminatedUnion("type", [
  publisherRegisterSchema,
  mediaRegisterSchema,
]);

export type RegisterInput = z.infer<typeof registerSchema>;
