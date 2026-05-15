import { Router } from "express";
import { z } from "zod";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

export const proverRouter = Router();
const execFileAsync = promisify(execFile);

const ALLOWED_MANIFEST_DIR = process.env.MANIFEST_DIR ?? "/data/manifests";

const ProveSchema = z.object({
  modelId: z.string().min(1).max(128),
  datasetManifestPath: z.string().min(1),
  outputDir: z.string().optional(),
});

proverRouter.post("/prove", async (req, res) => {
  const parsed = ProveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { modelId, datasetManifestPath, outputDir = "/tmp/proofs" } = parsed.data;

  // Prevent path traversal: resolve and confirm it stays within the allowed dir
  const resolved = path.resolve(datasetManifestPath);
  const allowed = path.resolve(ALLOWED_MANIFEST_DIR);
  if (!resolved.startsWith(allowed + path.sep) && resolved !== allowed) {
    return res.status(400).json({ error: "Manifest path is outside the allowed directory" });
  }
  if (!fs.existsSync(resolved)) {
    return res.status(400).json({ error: "Manifest file not found" });
  }

  const proverBin =
    process.env.PROVER_BIN ?? path.resolve(__dirname, "../../../prover/target/release/canon-prover");

  try {
    const { stdout } = await execFileAsync(proverBin, [
      "--model-id", modelId,
      "--manifest", resolved,
      "--output", outputDir,
    ]);

    // Extract the last non-empty line — the binary prints JSON on the final line
    const jsonLine = stdout.trim().split("\n").pop() ?? "";
    const result = JSON.parse(jsonLine) as {
      proof_hash: string;
      dataset_merkle_root: string;
    };

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
