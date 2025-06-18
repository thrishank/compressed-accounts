import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Counter } from "../target/types/counter";
import {
  bn,
  createRpc,
  deriveAddress,
  deriveAddressSeed,
} from "@lightprotocol/stateless.js";
import { getKeypairFromFile } from "@solana-developers/helpers";

describe("counter", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.counter as Program<Counter>;

  const url =
    "https://devnet.helius-rpc.com/?api-key=c991f045-ba1f-4d71-b872-0ef87e7f039d";
  const connection = createRpc(url, undefined, undefined);

  const addressTree = new anchor.web3.PublicKey(
    "smt1NamzXdq4AMqS2fS2F1i5KTYPZRhoHgWx38d8WsT"
  );
  const addressQueue = new anchor.web3.PublicKey(
    "nfq1NvQDJ2GEgnS8zt9prAe8rjjpAW1zFkrvZoBR148"
  );

  it("create", async () => {
    const keypair: anchor.web3.Signer = await getKeypairFromFile();

    const seeds: Uint8Array[] = [
      Buffer.from("counter123sf"),
      keypair.publicKey.toBuffer(),
    ];
    const assetSeed = deriveAddressSeed(
      seeds,
      new anchor.web3.PublicKey("3Vzvt2ZHPUhaK6iDuvd1zC8oKBQwmazJ713aJGmiUiXs")
    );
    const assetAddress = deriveAddress(assetSeed, addressTree);

    // const at = connection.getAddressTree;
    const proof = await connection.getValidityProofV0(undefined, [
      {
        address: bn(assetAddress.toBytes()),
        tree: addressTree,
        queue: addressQueue,
      },
    ]);

    const validityProof = proof.compressedProof;

    /// "smtAvYA5UbTRyKAkAj5kHs1CmrA42t6WkVLi4c6mA1f's signer privilege escalated",
    const remainingAccounts = [
      {
        pubkey: new anchor.web3.PublicKey(
          "SySTEM1eSU2p4BGQfQpimFEWWSC1XDFeun3Nqzz3rT7"
        ), // Light System Program
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: new anchor.web3.PublicKey(
          "smt1NamzXdq4AMqS2fS2F1i5KTYPZRhoHgWx38d8WsT"
        ), // Address Tree
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: new anchor.web3.PublicKey(
          "amt1Ayt45jfbdw5YSo7iz6WZxUmnZsQTYXy82hVwyC2"
        ),
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: new anchor.web3.PublicKey(
          "aq1S9z4reTSQAdgWHGD2zDaS39sjGrAxbR31vxJ2F4F"
        ), // Address Queue
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: new anchor.web3.PublicKey(
          "ComputeBudget111111111111111111111111111111"
        ), // Compute Budget
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: new anchor.web3.PublicKey(
          "35hkDgaAKwMCaxRz2ocSZ6NaUrtKkyNqU6c4RV3tYJRh"
        ), // Registered Program PDA
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: new anchor.web3.PublicKey(
          "noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV"
        ), // Noop Program
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: new anchor.web3.PublicKey(
          "HwXnGK3tPkkVY6P439H2p68AxpeuWXd5PcrAxFpbmfbA"
        ), // Merkle Tree (writable)
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: new anchor.web3.PublicKey(
          "compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq"
        ), // Compression Program
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: new anchor.web3.PublicKey("11111111111111111111111111111111"), // System Program
        isSigner: false,
        isWritable: false,
      },
    ];

    await program.methods
      .createCounter(
        {
          0: {
            a: validityProof.a,
            b: validityProof.b,
            c: validityProof.c,
          },
        },
        {
          addressMerkleTreePubkeyIndex: 1,
          addressQueuePubkeyIndex: 2,
          rootIndex: proof.rootIndices[0],
        },
        1
      )
      .accounts({ signer: keypair.publicKey })
      .remainingAccounts(remainingAccounts)
      .signers([keypair])
      .rpc();
  });
});
