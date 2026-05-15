import { Router } from "express";
import { z } from "zod";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

export const proverRouter = Router();
const execFileAsync = promisify(execFile);

const ProveSchema = z.object({
  modelId: z.string(),
  datasetManifestPath: z.string(), // path to JSON manifest of canon files
  outputDir: z.string().optional(),
});

/**
 * POST /api/prover/prove
 * Invokes the Rust/WASM ZK-ML prover binary to generate a proof,
 * then returns the proof_hash and dataset_merkle_root for on-chain submission.
 */
proverRouter.post("/prove", async (req, res) => {
  const parsed = ProveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { modelId, datasetManifestPath, outputDir = "/tmp/proofs" } = parsed.data;
  const proverBin = process.env.PROVER_BIN ?? path.resolve("../prover/target/release/canon-prover");

  try {
    const { stdout } = await execFileAsync(proverBin, [
      "--model-id", modelId,
      "--manifest", datasetManifestPath,
      "--output", outputDir,
    ]);

    const result = JSON.parse(stdout) as {
      proof_hash: string;
      dataset_merkle_root: string;
    };

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
