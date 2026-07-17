import "server-only";
import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";

/**
 * ストレージ抽象化。
 * v1 はローカルディスク実装:
 *   - 公開画像: public/uploads/ （/uploads/... で直接配信、next/image で最適化）
 *   - メディアキット: storage/mediakits/ （公開ディレクトリ外。認可付きAPI経由でのみ配信し、直リンク不可）
 * 本番で S3 互換ストレージへ移行する場合はこのモジュールの実装を差し替える。
 */

const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const PRIVATE_KIT_DIR = path.join(process.cwd(), "storage", "mediakits");

function safeExt(filename: string): string {
  const ext = path.extname(filename).toLowerCase().replace(/[^a-z0-9.]/g, "");
  return ext.slice(0, 10);
}

function randomKey(): string {
  return crypto.randomBytes(12).toString("hex");
}

/** 公開画像を保存し、公開URLパスを返す */
export async function savePublicImage(
  buffer: Buffer,
  originalName: string
): Promise<{ url: string }> {
  await mkdir(PUBLIC_UPLOAD_DIR, { recursive: true });
  const name = `${randomKey()}${safeExt(originalName)}`;
  await writeFile(path.join(PUBLIC_UPLOAD_DIR, name), buffer);
  return { url: `/uploads/${name}` };
}

/** メディアキットを非公開領域に保存し、fileKey を返す（URLは公開しない） */
export async function savePrivateMediaKit(
  buffer: Buffer,
  originalName: string
): Promise<{ fileKey: string }> {
  await mkdir(PRIVATE_KIT_DIR, { recursive: true });
  const fileKey = `${randomKey()}${safeExt(originalName)}`;
  await writeFile(path.join(PRIVATE_KIT_DIR, fileKey), buffer);
  return { fileKey };
}

/** fileKey からメディアキットの実体を読み出す（認可済みAPIからのみ呼ぶこと） */
export async function readPrivateMediaKit(fileKey: string): Promise<Buffer> {
  // パストラバーサル防止
  if (!/^[a-z0-9]+(\.[a-z0-9]+)?$/.test(fileKey)) {
    throw new Error("invalid file key");
  }
  return readFile(path.join(PRIVATE_KIT_DIR, fileKey));
}

export async function deletePrivateMediaKit(fileKey: string): Promise<void> {
  if (!/^[a-z0-9]+(\.[a-z0-9]+)?$/.test(fileKey)) return;
  try {
    await unlink(path.join(PRIVATE_KIT_DIR, fileKey));
  } catch {
    // 既に存在しない場合は無視
  }
}
