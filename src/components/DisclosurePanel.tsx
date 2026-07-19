"use client";

import { useEffect, useState } from "react";

interface PressContact {
  dept: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
}

interface MediaKitFile {
  id: string;
  fileName: string;
  fileSize: number;
}

interface Labels {
  title: string;
  note: string;
  contactHeading: string;
  mediaInfoHeading: string;
  mediaKitHeading: string;
  download: string;
  disclose: string;
  revealing: string;
  mediaOnlyPrompt: string;
  loginCta: string;
  recorded: string;
  failed: string;
  dept: string;
  name: string;
  email: string;
  phone: string;
}

/**
 * メディア関係者限定情報のモザイク開示パネル。
 * 実データは公開HTMLに含めず、メディアが「開示する」を押した時のみ
 * 認可付きAPI経由で取得・表示し、開示請求を記録する。
 */
export function DisclosurePanel({
  releaseId,
  hasPressContact,
  hasMediaOnlyInfo,
  hasMediaKit,
  loginHref,
  labels,
}: {
  releaseId: string;
  hasPressContact: boolean;
  hasMediaOnlyInfo: boolean;
  hasMediaKit: boolean;
  loginHref: string;
  labels: Labels;
}) {
  const [role, setRole] = useState<string | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<{
    pressContact: PressContact | null;
    mediaOnlyInfo: string | null;
    mediaKitFiles: MediaKitFile[];
  } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active) setRole(d?.user?.role ?? null);
      })
      .catch(() => {
        if (active) setRole(null);
      });
    return () => {
      active = false;
    };
  }, []);

  async function disclose() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/releases/${releaseId}/disclose`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      setError(labels.failed);
      return;
    }
    setRevealed(await res.json());
  }

  const isMedia = role === "MEDIA";
  const opened = revealed !== null;

  return (
    <section className="mt-10 rounded-lg border border-gray-200 bg-gray-50 p-5">
      <h2 className="text-base font-semibold">{labels.title}</h2>
      <p className="mt-1 text-sm text-gray-500">{labels.note}</p>

      <div className="mt-4 space-y-4">
        {hasPressContact && (
          <div className="rounded border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-700">
              {labels.contactHeading}
            </h3>
            {opened && revealed?.pressContact ? (
              <dl className="mt-2 space-y-1 text-sm">
                <Row label={labels.dept} value={revealed.pressContact.dept} />
                <Row label={labels.name} value={revealed.pressContact.name} />
                <Row label={labels.email} value={revealed.pressContact.email} isEmail />
                <Row label={labels.phone} value={revealed.pressContact.phone} />
              </dl>
            ) : (
              <MosaicLines lines={3} />
            )}
          </div>
        )}

        {hasMediaOnlyInfo && (
          <div className="rounded border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-700">
              {labels.mediaInfoHeading}
            </h3>
            {opened ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                {revealed?.mediaOnlyInfo}
              </p>
            ) : (
              <MosaicLines lines={4} />
            )}
          </div>
        )}

        {hasMediaKit && (
          <div className="rounded border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-700">
              {labels.mediaKitHeading}
            </h3>
            {opened && revealed?.mediaKitFiles?.length ? (
              <ul className="mt-2 space-y-2 text-sm">
                {revealed.mediaKitFiles.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3">
                    <span>
                      {f.fileName}
                      <span className="ml-2 text-xs text-gray-400">
                        {(f.fileSize / 1024 / 1024).toFixed(1)}MB
                      </span>
                    </span>
                    <a
                      href={`/api/media-kit/${f.id}`}
                      className="rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
                    >
                      {labels.download}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <MosaicLines lines={2} />
            )}
          </div>
        )}
      </div>

      {!opened && (
        <div className="mt-4">
          {isMedia ? (
            <button
              type="button"
              onClick={disclose}
              disabled={busy}
              className="rounded bg-[#d51f1a] px-5 py-2 text-sm font-semibold text-white hover:bg-[#b3160f] disabled:opacity-50"
            >
              {busy ? labels.revealing : labels.disclose}
            </button>
          ) : (
            <p className="text-sm text-gray-500">
              {labels.mediaOnlyPrompt}{" "}
              <a href={loginHref} className="text-blue-700 hover:underline">
                {labels.loginCta}
              </a>
            </p>
          )}
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        </div>
      )}

      {opened && <p className="mt-4 text-xs text-gray-500">{labels.recorded}</p>}
    </section>
  );
}

function Row({
  label,
  value,
  isEmail,
}: {
  label: string;
  value: string | null;
  isEmail?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 text-gray-500">{label}</dt>
      <dd className="min-w-0 break-words text-gray-800">
        {isEmail ? (
          <a href={`mailto:${value}`} className="text-blue-700 hover:underline">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

/** モザイク（ぼかし）表示のダミー行。実データは含まない。 */
function MosaicLines({ lines }: { lines: number }) {
  const widths = ["100%", "92%", "78%", "85%", "60%"];
  return (
    <div
      aria-hidden="true"
      className="mt-3 select-none space-y-2 blur-sm"
      style={{ filter: "blur(5px)" }}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <span
          key={i}
          className="block h-3 rounded bg-gray-300"
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  );
}
