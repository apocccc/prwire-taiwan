import "server-only";
import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

/**
 * ストレージ抽象化。
 * - R2（Cloudflare, S3互換）が設定されていれば R2 を使用:
 *     - 公開画像: R2_BUCKET_PUBLIC の uploads/ 配下。NEXT_PUBLIC_R2_PUBLIC_URL で配信
 *     - メディアキット: R2_BUCKET_PRIVATE の mediakits/ 配下（パブリック非公開）。
 *       認可付きAPI経由でのみ配信し、直リンク不可
 * - R2 未設定ならローカルディスクにフォールバック（ローカル開発用）:
 *     - 公開画像: public/uploads/  ・  メディアキット: storage/mediakits/
 *
 * fileKey は「<hex><ext>」形式（フォルダを含まない）で保持し、
 * バケット内のプレフィックス（uploads/ ・ mediakits/）は本モジュール内で付与する。
 */

const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const PRIVATE_KIT_DIR = path.join(process.cwd(), "storage", "mediakits");

const PUBLIC_PREFIX = "uploads/";
const PRIVATE_PREFIX = "mediakits/";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_PUBLIC = process.env.R2_BUCKET_PUBLIC || "tpw-public";
const R2_BUCKET_PRIVATE = process.env.R2_BUCKET_PRIVATE || "tpw-private";
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

const useR2 = Boolean(
  R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_PUBLIC_URL
);

let _client: S3Client | null = null;
function r2(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      // R2 は path-style での addressing が確実（仮想ホスト形式での不整合を避ける）
      forcePathStyle: true,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID as string,
        secretAccessKey: R2_SECRET_ACCESS_KEY as string,
      },
    });
  }
  return _client;
}

function safeExt(filename: string): string {
  const ext = path.extname(filename).toLowerCase().replace(/[^a-z0-9.]/g, "");
  return ext.slice(0, 10);
}

function randomKey(): string {
  return crypto.randomBytes(12).toString("hex");
}

/** メディアキットの fileKey バリデーション（パストラバーサル防止） */
function assertValidKey(fileKey: string): void {
  if (!/^[a-z0-9]+(\.[a-z0-9]+)?$/.test(fileKey)) {
    throw new Error("invalid file key");
  }
}

async function streamToBuffer(body: unknown): Promise<Buffer> {
  // Node.js Readable（@aws-sdk）を Buffer 化
  const chunks: Buffer[] = [];
  const stream = body as AsyncIterable<Uint8Array>;
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/** 公開画像を保存し、公開URLを返す */
export async function savePublicImage(
  buffer: Buffer,
  originalName: string,
  contentType?: string
): Promise<{ url: string }> {
  const name = `${randomKey()}${safeExt(originalName)}`;
  if (useR2) {
    await r2().send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_PUBLIC,
        Key: `${PUBLIC_PREFIX}${name}`,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    return { url: `${R2_PUBLIC_URL}/${PUBLIC_PREFIX}${name}` };
  }
  await mkdir(PUBLIC_UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(PUBLIC_UPLOAD_DIR, name), buffer);
  return { url: `/uploads/${name}` };
}

/** メディアキットを非公開領域に保存し、fileKey を返す（URLは公開しない） */
export async function savePrivateMediaKit(
  buffer: Buffer,
  originalName: string,
  contentType?: string
): Promise<{ fileKey: string }> {
  const fileKey = `${randomKey()}${safeExt(originalName)}`;
  if (useR2) {
    await r2().send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_PRIVATE,
        Key: `${PRIVATE_PREFIX}${fileKey}`,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return { fileKey };
  }
  await mkdir(PRIVATE_KIT_DIR, { recursive: true });
  await writeFile(path.join(PRIVATE_KIT_DIR, fileKey), buffer);
  return { fileKey };
}

/** fileKey からメディアキットの実体を読み出す（認可済みAPIからのみ呼ぶこと） */
export async function readPrivateMediaKit(fileKey: string): Promise<Buffer> {
  assertValidKey(fileKey);
  if (useR2) {
    const res = await r2().send(
      new GetObjectCommand({
        Bucket: R2_BUCKET_PRIVATE,
        Key: `${PRIVATE_PREFIX}${fileKey}`,
      })
    );
    return streamToBuffer(res.Body);
  }
  return readFile(path.join(PRIVATE_KIT_DIR, fileKey));
}

export async function deletePrivateMediaKit(fileKey: string): Promise<void> {
  if (!/^[a-z0-9]+(\.[a-z0-9]+)?$/.test(fileKey)) return;
  if (useR2) {
    try {
      await r2().send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET_PRIVATE,
          Key: `${PRIVATE_PREFIX}${fileKey}`,
        })
      );
    } catch {
      // 既に存在しない場合は無視
    }
    return;
  }
  try {
    await unlink(path.join(PRIVATE_KIT_DIR, fileKey));
  } catch {
    // 既に存在しない場合は無視
  }
}
