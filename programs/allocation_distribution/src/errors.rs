use anchor_lang::prelude::*;

#[error_code]
pub enum DistributionError {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Program is currently paused")]
    ProgramPaused,
    #[msg("Epoch is already completed")]
    EpochCompleted,
    #[msg("Payout already claimed for this epoch")]
    AlreadyClaimed,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Invalid token account")]
    InvalidTokenAccount,
    #[msg("Insufficient balance for payout")]
    InsufficientBalance,
    #[msg("Invalid treasury wallet")]
    InvalidTreasury,
}
