import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaVoting } from "../target/types/solana_voting";
import { assert } from "chai";

describe("solana-voting", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SolanaVoting as Program<SolanaVoting>;

  let pollAccount = anchor.web3.Keypair.generate();

  // Additional voters
  const voter1 = anchor.web3.Keypair.generate();
  const voter2 = anchor.web3.Keypair.generate();

  // Helper to airdrop to a keypair (since they need lamports to sign)
  async function airdrop(keypair: anchor.web3.Keypair, amount = 2) {
    const sig = await provider.connection.requestAirdrop(
      keypair.publicKey,
      amount * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig, "confirmed");
  }

  it("Creates a poll", async () => {
    const tx = await program.methods
      .createPoll("Best crypto?", ["Solana", "Ethereum", "Bitcoin"])
      .accounts({
        poll: pollAccount.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([pollAccount])
      .rpc();

    const poll = await program.account.poll.fetch(pollAccount.publicKey);
    assert.equal(poll.question, "Best crypto?");
    assert.deepEqual(poll.options, ["Solana", "Ethereum", "Bitcoin"]);
    assert.deepEqual(poll.votes, [0, 0, 0]);
  });

  it("Allows multiple distinct wallets to vote once each", async () => {
    // Airdrop lamports to additional voters so they can pay for transactions
    await airdrop(voter1);
    await airdrop(voter2);

    // Voter1 votes for option 0
    await program.methods
      .vote(0)
      .accounts({
        poll: pollAccount.publicKey,
        voter: voter1.publicKey,
      })
      .signers([voter1])
      .rpc();

    // Voter2 votes for option 1
    await program.methods
      .vote(1)
      .accounts({
        poll: pollAccount.publicKey,
        voter: voter2.publicKey,
      })
      .signers([voter2])
      .rpc();

    // Fetch and validate
    const poll = await program.account.poll.fetch(pollAccount.publicKey);
    assert.equal(poll.votes[0], 1, "Option 0 should have one vote from voter1");
    assert.equal(poll.votes[1], 1, "Option 1 should have one vote from voter2");

    const votersBase58 = poll.voters.map((k: anchor.web3.PublicKey) => k.toBase58());
    assert.include(votersBase58, voter1.publicKey.toBase58());
    assert.include(votersBase58, voter2.publicKey.toBase58());
  });

  it("Rejects double voting per wallet", async () => {
    // Try voting again with voter1
    try {
      await program.methods
        .vote(2)
        .accounts({
          poll: pollAccount.publicKey,
          voter: voter1.publicKey,
        })
        .signers([voter1])
        .rpc();
      assert.fail("Expected double vote from voter1 to be rejected");
    } catch (err: any) {
      const errMsg = err.error.errorMessage || err.toString();
      assert.match(errMsg, /You have already voted/);
    }
  });
});
