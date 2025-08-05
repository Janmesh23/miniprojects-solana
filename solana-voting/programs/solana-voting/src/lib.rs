use anchor_lang::prelude::*;

declare_id!("GbFgwQt5Upm9PNgug8vu2FKMFFm1qPpU8StwNMpr4Gi1"); // Replace with your deployed program ID

#[program]
pub mod solana_voting {
    use super::*;

    pub fn create_poll(ctx: Context<CreatePoll>, question: String, options: Vec<String>) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        poll.author = *ctx.accounts.authority.key;
        poll.question = question;
        poll.options = options;
        let options_len = poll.options.len();
        poll.votes = vec![0; options_len];
        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, option_index: u8) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        let voter = &ctx.accounts.voter;

        require!(
            (option_index as usize) < poll.options.len(),
            VotingError::InvalidOption
        );
        require!(
            !poll.voters.contains(&voter.key()),
            VotingError::AlreadyVoted
        );

        poll.votes[option_index as usize] += 1;
        poll.voters.push(voter.key());
        Ok(())
    }
}

#[account]
pub struct Poll {
    pub author: Pubkey,
    pub question: String,
    pub options: Vec<String>,
    pub votes: Vec<u32>,
    pub voters: Vec<Pubkey>,
}

#[derive(Accounts)]
pub struct CreatePoll<'info> {
    #[account(init, payer = authority, space = 8 + 1024)]
    pub poll: Account<'info, Poll>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub poll: Account<'info, Poll>,
    pub voter: Signer<'info>,
}

#[error_code]
pub enum VotingError {
    #[msg("Invalid option selected.")]
    InvalidOption,
    #[msg("You have already voted.")]
    AlreadyVoted,
}
