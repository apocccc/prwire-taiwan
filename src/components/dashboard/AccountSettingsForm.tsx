"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export interface AccountInfo {
  email: string;
  name: string | null;
}

export function AccountSettingsForm({ initial }: { initial: AccountInfo }) {
  const t = useTranslations("account");
  const tCommon = useTranslations("common");

  const [name, setName] = useState(initial.name ?? "");
  const [email, setEmail] = useState(initial.email);
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState<string | null>(null);

  // メール変更フロー: idle → code sent → confirmed
  const [newEmail, setNewEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [emailErr, setEmailErr] = useState<string | null>(null);

  const inputCls = "mt-1 w-full rounded border border-gray-300 px-3 py-2";
  const labelCls = "block text-sm font-medium";

  async function saveName() {
    setSavingName(true);
    setNameMsg(null);
    const res = await fetch("/api/account", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || null }),
    });
    setSavingName(false);
    setNameMsg(res.ok ? tCommon("save") : t("saveFailed"));
  }

  function errText(codeStr: string): string {
    switch (codeStr) {
      case "email_taken":
        return t("emailTaken");
      case "same_email":
        return t("sameEmail");
      case "code_invalid":
        return t("codeInvalid");
      case "code_expired":
        return t("codeExpired");
      default:
        return t("saveFailed");
    }
  }

  async function requestCode() {
    setEmailBusy(true);
    setEmailErr(null);
    setEmailMsg(null);
    const res = await fetch("/api/account/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newEmail }),
    });
    setEmailBusy(false);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setEmailErr(errText(data?.error));
      return;
    }
    setCodeSent(true);
    setDevCode(data?.devCode ?? null);
    setEmailMsg(t("codeSent"));
  }

  async function confirmCode() {
    setEmailBusy(true);
    setEmailErr(null);
    setEmailMsg(null);
    const res = await fetch("/api/account/email", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setEmailBusy(false);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setEmailErr(errText(data?.error));
      return;
    }
    setEmail(data?.email ?? newEmail);
    setCodeSent(false);
    setNewEmail("");
    setCode("");
    setDevCode(null);
    setEmailMsg(t("emailChanged"));
  }

  return (
    <div className="space-y-6">
      {/* 表示名 */}
      <div>
        <label className={labelCls}>{t("name")}</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={saveName}
            disabled={savingName}
            className="rounded bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {savingName ? "..." : tCommon("save")}
          </button>
          {nameMsg && <span className="text-sm text-green-700">{nameMsg}</span>}
        </div>
      </div>

      {/* 登録メールアドレス */}
      <div className="rounded border border-gray-200 p-4">
        <h3 className="font-semibold">{t("email")}</h3>
        <p className="mt-1 text-sm text-gray-600">
          {t("currentEmail")}: <span className="font-medium">{email}</span>
        </p>
        <p className="mt-1 text-xs text-gray-500">{t("emailChangeNote")}</p>

        {emailErr && (
          <p role="alert" className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {emailErr}
          </p>
        )}
        {emailMsg && <p className="mt-3 text-sm text-green-700">{emailMsg}</p>}

        {!codeSent ? (
          <div className="mt-3">
            <label className={labelCls}>{t("newEmail")}</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={inputCls}
              placeholder="new@example.com"
            />
            <button
              type="button"
              onClick={requestCode}
              disabled={emailBusy || !newEmail}
              className="mt-2 rounded border border-gray-300 px-4 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              {emailBusy ? "..." : t("sendCode")}
            </button>
          </div>
        ) : (
          <div className="mt-3">
            {devCode && (
              <p className="mb-2 rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {t("devCodeNote")}: <span className="font-mono font-bold">{devCode}</span>
              </p>
            )}
            <label className={labelCls}>{t("enterCode")}</label>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`${inputCls} max-w-40 tracking-widest`}
              placeholder="000000"
            />
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={confirmCode}
                disabled={emailBusy || !code}
                className="rounded bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
              >
                {emailBusy ? "..." : t("confirmChange")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCodeSent(false);
                  setCode("");
                  setDevCode(null);
                  setEmailMsg(null);
                  setEmailErr(null);
                }}
                className="text-sm text-gray-500 hover:underline"
              >
                {tCommon("cancel")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
