use anchor_lang::prelude::*;

#[account]
pub struct MintAuthorityAccount {
    pub project_id: u64,
    pub bump:       u8,
}

impl MintAuthorityAccount {
    pub const SIZE: usize = 8 + 8 + 1;
}
