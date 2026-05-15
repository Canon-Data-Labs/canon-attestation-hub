import { Router } from "express";
import { z } from "zod";
import { getAttestation, submitAttestation } from "../stellar/client";

export const attestationRouter = Router();

const SubmitSchema = z.object({
  proverSecret: z.string(),
  modelId: z.string(),
  datasetMerkleRoot: z.string().regex(/^[0-9a-f]{64}$/i),
  proofHash: z.string().regex(/^[0-9a-f]{64}$/i),
});

attestationRouter.post("/", async (req, res) => {
  const parsed = SubmitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    const txHash = await submitAttestation(parsed.data);
    return res.json({ txHash });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

attestationRouter.get("/:proofHash", async (req, res) => {
  try {
    const record = await getAttestation(req.params.proofHash);
    return res.json(record);
  } catch (err: any) {
    return res.status(404).json({ error: err.message });
  }
});
