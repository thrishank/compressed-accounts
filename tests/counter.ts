import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Counter } from "../target/types/counter";
import {
  bn,
  createRpc,
  defaultTestStateTreeAccounts2,
  deriveAddress,
  deriveAddressSeed,
  hashToBn254FieldSizeBe,
  NewAddressParams,
} from "@lightprotocol/stateless.js";

describe("counter", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.counter as Program<Counter>;

  const url =
    "https://devnet.helius-rpc.com/?api-key=c991f045-ba1f-4d71-b872-0ef87e7f039d";
  const connection = createRpc(url, undefined, undefined);

  const addressTree = defaultTestStateTreeAccounts2().merkleTree2;
  const addressQueue = defaultTestStateTreeAccounts2().nullifierQueue2;

  const randomBytes = anchor.web3.Keypair.generate().publicKey.toBytes();
  it("create", async () => {
    const seeds: Uint8Array[] = [
      Buffer.from("counter"),
      new anchor.web3.PublicKey(
        "thrbabBvANwvKdV34GdrFUDXB6YMsksdfmiKj2ZUV3a"
      ).toBuffer(),
    ];
    const assetSeed = deriveAddressSeed(seeds, new anchor.web3.PublicKey(""));
    const assetAddress = deriveAddress(assetSeed, addressTree);
    const proof = await connection.getValidityProofV0(undefined, [
      {
        address: bn(assetAddress.toBytes()),
        tree: addressTree,
        queue: addressQueue,
      },
    ]);

    const validityProof = proof.compressedProof;
  });
});
