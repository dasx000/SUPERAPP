import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { mkdir } from "fs/promises";

const execFileAsync = promisify(execFile);

const SCRIPT_PATH = path.join(process.cwd(), "scripts", "stamp_ttd.py");
const CONTOH_PNG = path.join(process.cwd(), "public", "contoh.png");

async function runStamp(inputPath: string, outputPath: string, ttdImagePath: string) {
  const python = process.platform === "win32" ? "py" : "python3";
  const args = process.platform === "win32"
    ? ["-3.11", SCRIPT_PATH, inputPath, outputPath, ttdImagePath]
    : [SCRIPT_PATH, inputPath, outputPath, ttdImagePath];
  await execFileAsync(python, args);
}

export async function stampPdf(
  inputPath: string,
  ttdImagePath: string,
  docId: string
): Promise<string> {
  const outputDir = path.join(process.cwd(), "uploads", "results");
  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${docId}_signed.pdf`);
  await runStamp(inputPath, outputPath, ttdImagePath);
  return outputPath;
}

export async function stampPreview(inputPath: string, docId: string): Promise<string> {
  const outputDir = path.join(process.cwd(), "uploads", "previews");
  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${docId}_preview.pdf`);
  await runStamp(inputPath, outputPath, CONTOH_PNG);
  return outputPath;
}
