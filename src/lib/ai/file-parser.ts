import { createClient } from "@/lib/supabase/server";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function extractTextFromAsset(
  storagePath: string
): Promise<string> {
  const supabase = await createClient();
  const ext = storagePath.split(".").pop()?.toLowerCase();

  const { data, error } = await supabase.storage
    .from("project-assets")
    .download(storagePath);

  if (error || !data) {
    throw new Error(`Failed to download asset: ${error?.message ?? "Unknown"}`);
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  const looksLikePdf = isPdfBuffer(buffer);
  const looksLikeZip = isZipBuffer(buffer);
  const looksLikeText = isLikelyPlainTextBuffer(buffer);

  if (ext === "pdf" || looksLikePdf) {
    return extractTextFromPdf(buffer);
  }

  if (ext === "docx") {
    if (looksLikeZip) {
      return extractTextFromDocx(buffer);
    }

    if (looksLikeText) {
      return normalizeExtractedText(buffer.toString("utf-8"));
    }

    return extractTextFromDoc(buffer);
  }

  if (ext === "doc") {
    if (looksLikeZip) {
      return extractTextFromDocx(buffer);
    }

    return extractTextFromDoc(buffer);
  }

  if (ext === "txt" || looksLikeText) {
    return normalizeExtractedText(buffer.toString("utf-8"));
  }

  if (looksLikeZip) {
    return extractTextFromDocx(buffer);
  }

  throw new Error(`Unsupported file type: .${ext}`);
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const mod = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const loadingTask = mod.getDocument({ data });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(text);
  }

  return normalizeExtractedText(pages.join("\n\n"));
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return normalizeExtractedText(result.value);
}

async function extractTextFromDoc(buffer: Buffer): Promise<string> {
  const viaStrings = await extractTextFromLegacyDocWithStrings(buffer);
  if (viaStrings) {
    return viaStrings;
  }

  const heuristic = extractReadableTextFromBinary(buffer);
  if (heuristic) {
    return heuristic;
  }

  throw new Error("Unable to extract readable text from .doc file");
}

async function extractTextFromLegacyDocWithStrings(
  buffer: Buffer
): Promise<string | null> {
  const tempPath = join(tmpdir(), `vernio-doc-${randomUUID()}.doc`);

  try {
    await fs.writeFile(tempPath, buffer);
    const { stdout } = await execFileAsync("strings", ["-n", "4", tempPath]);
    const normalized = normalizeExtractedText(stdout);
    return normalized || null;
  } catch {
    return null;
  } finally {
    await fs.unlink(tempPath).catch(() => undefined);
  }
}

function extractReadableTextFromBinary(buffer: Buffer): string {
  const utf16 = collectReadableSegments(
    buffer
      .toString("utf16le")
      .replace(/\u0000/g, "")
  );
  const latin1 = collectReadableSegments(buffer.toString("latin1"));

  const merged = [utf16, latin1].filter(Boolean).join("\n");
  return normalizeExtractedText(merged);
}

function collectReadableSegments(input: string): string {
  const matches = input.match(/[A-Za-z0-9][A-Za-z0-9 .,:;'"!?()\-_/&%]{3,}/g) ?? [];
  const seen = new Set<string>();
  const segments: string[] = [];

  for (const match of matches) {
    const cleaned = match.replace(/\s+/g, " ").trim();
    if (cleaned.length < 4 || seen.has(cleaned)) {
      continue;
    }

    seen.add(cleaned);
    segments.push(cleaned);
  }

  return segments.join("\n");
}

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\u0000/g, "")
    .trim();
}

function isZipBuffer(buffer: Buffer): boolean {
  return buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    [0x03, 0x05, 0x07].includes(buffer[2]) &&
    [0x04, 0x06, 0x08].includes(buffer[3]);
}

function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer.subarray(0, 4).toString("ascii") === "%PDF";
}

function isLikelyPlainTextBuffer(buffer: Buffer): boolean {
  if (buffer.length === 0) {
    return false;
  }

  const sample = buffer.subarray(0, Math.min(buffer.length, 2048));
  let printable = 0;

  for (const byte of sample) {
    if (
      byte === 0x09 ||
      byte === 0x0a ||
      byte === 0x0d ||
      (byte >= 0x20 && byte <= 0x7e)
    ) {
      printable += 1;
    }
  }

  return printable / sample.length > 0.85;
}
