import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { mkdir } from "fs/promises";

const execFileAsync = promisify(execFile);

export async function stampPdf(
  inputPath: string,
  ttdImagePath: string,
  docId: string
): Promise<string> {
  const outputDir = path.join(process.cwd(), "uploads", "results");
  await mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `${docId}_signed.pdf`);
  const scriptPath = path.join(process.cwd(), "scripts", "stamp_ttd.py");

  const python = process.platform === "win32" ? "py" : "python3";
  const args = process.platform === "win32"
    ? ["-3.11", scriptPath, inputPath, outputPath, ttdImagePath]
    : [scriptPath, inputPath, outputPath, ttdImagePath];

  await execFileAsync(python, args);

  return outputPath;
}
