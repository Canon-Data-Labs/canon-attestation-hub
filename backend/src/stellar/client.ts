import {
  Contract,
  Keypair,
  Networks,
  SorobanRpc,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";

const server = new SorobanRpc.Server(
  process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org"
);
const networkPassphrase =
  process.env.STELLAR_NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;

function getContractId(): string {
  const id = process.env.ATTESTATION_CONTRACT_ID;
  if (!id) throw new Error("ATTESTATION_CONTRACT_ID is not set");
  return id;
}

/** Poll until a submitted transaction is confirmed or fails (max ~30s). */
async function pollTx(hash: string): Promise<SorobanRpc.Api.GetTransactionResponse> {
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const result = await server.getTransaction(hash);
    if (result.status !== SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) return result;
  }
  throw new Error(`Transaction ${hash} not confirmed after 30s`);
}

export async function submitAttestation(params: {
  proverSecret: string;
  modelId: string;
  datasetMerkleRoot: string;
  proofHash: string;
}): Promise<string> {
  const keypair = Keypair.fromSecret(params.proverSecret);
  const account = await server.getAccount(keypair.publicKey());
  const contract = new Contract(getContractId());

  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
    .addOperation(
      contract.call(
        "submit_attestation",
        nativeToScVal(keypair.publicKey(), { type: "address" }),
        nativeToScVal(params.modelId, { type: "string" }),
        nativeToScVal(Buffer.from(params.datasetMerkleRoot, "hex"), { type: "bytes" }),
        nativeToScVal(Buffer.from(params.proofHash, "hex"), { type: "bytes" })
      )
    )
    .setTimeout(30)
    .build();

  const prepared = await server.prepareTransaction(tx);
  prepared.sign(keypair);
  const sent = await server.sendTransaction(prepared);
  if (sent.status === "ERROR") throw new Error(`Submit failed: ${sent.errorResult}`);

  const confirmed = await pollTx(sent.hash);
  if (confirmed.status !== SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction failed: ${confirmed.status}`);
  }
  return sent.hash;
}

export async function getAttestation(proofHash: string) {
  const contract = new Contract(getContractId());

  // Use a well-known testnet/mainnet friendbot-funded account for simulation,
  // or fall back to the contract's own account as source (read-only sim only needs a valid account).
  const sourceKey = process.env.SOROBAN_SOURCE_PUBLIC_KEY;
  if (!sourceKey) throw new Error("SOROBAN_SOURCE_PUBLIC_KEY is not set for read simulation");

  const account = await server.getAccount(sourceKey);
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
    .addOperation(
      contract.call(
        "get_attestation",
        nativeToScVal(Buffer.from(proofHash, "hex"), { type: "bytes" })
      )
    )
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) throw new Error(sim.error);
  const val = (sim as SorobanRpc.Api.SimulateTransactionSuccessResponse).result?.retval;
  return val ? scValToNative(val) : null;
}
