import "server-only";
import { Resend } from "resend";

/**
 * メール送信（Resend）。
 * RESEND_API_KEY 未設定時は送信せず、開発ログに出すだけの no-op として振る舞う
 * （ローカル開発を止めないため）。本番では Vercel/ローカルの env に設定する。
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@taiwanpublicwire.info";

let _client: Resend | null = null;
function client(): Resend | null {
  if (!RESEND_API_KEY) return null;
  if (!_client) _client = new Resend(RESEND_API_KEY);
  return _client;
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail(
  input: SendEmailInput
): Promise<{ sent: boolean; id?: string; error?: string }> {
  const c = client();
  if (!c) {
    // 未設定時は送信をスキップ（開発時に内容を確認できるようログ）
    console.info(`[email:skipped] to=${input.to} subject=${input.subject}`);
    return { sent: false };
  }
  try {
    const { data, error } = await c.emails.send({
      from: EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });
    if (error) return { sent: false, error: error.message };
    return { sent: true, id: data?.id };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** 汎用のシンプルなHTMLラッパー */
function wrap(bodyHtml: string): string {
  return `<div style="font-family:system-ui,-apple-system,'Noto Sans TC',sans-serif;max-width:560px;margin:0 auto;color:#111">
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
    <p style="font-size:12px;color:#888">Taiwan Public Wire / 台灣公共新聞線<br/>
    <a href="${siteUrl}" style="color:#888">${siteUrl}</a></p>
  </div>`;
}

/** メディア承認通知（PENDING→ACTIVE） */
export function mediaApprovedEmail(loginUrl: string) {
  return {
    subject: "【Taiwan Public Wire】媒體帳號已通過審核 / Your media account is approved",
    html: wrap(
      `<h2 style="font-size:18px">媒體帳號已通過審核</h2>
       <p>您的媒體帳號已通過審核，現在可以登入媒體專區，瀏覽媒體限定資訊並下載媒體資料袋。</p>
       <p><a href="${loginUrl}" style="display:inline-block;background:#d51f1a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">登入媒體專區</a></p>
       <p style="color:#666;font-size:13px">Your media account has been approved. You can now sign in to the Media Room.</p>`
    ),
    text: `您的媒體帳號已通過審核。登入: ${loginUrl}`,
  };
}

/** 情報開示があったことの事業者向け通知 */
export function disclosureNotifyEmail(params: {
  outletName: string;
  releaseTitle: string;
  dashboardUrl: string;
}) {
  return {
    subject: "【Taiwan Public Wire】媒體已開示您的聯絡資訊 / A media outlet requested your contact",
    html: wrap(
      `<h2 style="font-size:18px">有媒體開示了您的資訊</h2>
       <p><strong>${params.outletName}</strong> 已開示您新聞稿「${params.releaseTitle}」的聯絡資訊／媒體限定資訊。</p>
       <p>您可在管理後台的「媒體動態」查看該媒體的詳細資訊。</p>
       <p><a href="${params.dashboardUrl}" style="display:inline-block;background:#111;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">前往管理後台</a></p>`
    ),
    text: `${params.outletName} 已開示您新聞稿「${params.releaseTitle}」的資訊。管理後台: ${params.dashboardUrl}`,
  };
}
