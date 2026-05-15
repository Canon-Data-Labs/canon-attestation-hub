import "dotenv/config";
import express from "express";
import cors from "cors";
import { attestationRouter } from "./routes/attestation";
import { proverRouter } from "./routes/prover";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/attestations", attestationRouter);
app.use("/api/prover", proverRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => console.log(`canon-attestation-backend on :${PORT}`));
