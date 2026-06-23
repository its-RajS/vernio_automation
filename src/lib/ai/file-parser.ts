import { createClient } from "@/lib/supabase/server";

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

  if (ext === "pdf") {
    return extractTextFromPdf(buffer);
  }

  if (ext === "docx") {
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
    const text = content.items.map((item: any) => item.str).join(" ");
    pages.push(text);
  }

  return pages.join("\n\n");
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
