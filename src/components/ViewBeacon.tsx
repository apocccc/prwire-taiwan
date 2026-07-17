"use client";

import { useEffect } from "react";

/** 記事表示時に一度だけPVを記録（ISRページのためクライアントから送信） */
export function ViewBeacon({ releaseId }: { releaseId: string }) {
  useEffect(() => {
    const key = `pv:${releaseId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage 不可の環境でも計測は続行
    }
    navigator.sendBeacon?.(`/api/releases/${releaseId}/view`) ??
      fetch(`/api/releases/${releaseId}/view`, { method: "POST", keepalive: true });
  }, [releaseId]);

  return null;
}
