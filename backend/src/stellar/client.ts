import {
  Contract,
  Keypair,
  Networks,
  SorobanRpc,
  TransactionBuilder,
  BASE_FEE,
  xdr,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";

const server = new SorobanRpc.Server(
  process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org"
);
const networkPassphrase = process.env.STELLAR_NETWORK === "mainnet"
  ? Networks.PUBLIC
  : Networks.TESTNET;

const CONTRACT_ID = process.env.ATTESTATION_CONTRACT_ID ?? "";

export async function submitAttestation(params: {
  proverSecret: string;
  modelId: string;
  datasetMerkleRoot: string; // hex
  proofHash: string;         // hex
}): Promise<string> {
  const keypair = Keypair.fromSecret(params.proverSecret);
  const account = await server.getAccount(keypair.publicKey());
  const contract = new Contract(CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
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
  const result = await server.sendTransaction(prepared);
  return result.hash;
}

export async function getAttestation(proofHash: string) {
  const contract = new Contract(CONTRACT_ID);
  const keypair = Keypair.random();
  const account = await server.getAccount(keypair.publicKey()).catch(() => null);
  if (!account) throw new Error("Cannot fetch account for simulation");

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
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
