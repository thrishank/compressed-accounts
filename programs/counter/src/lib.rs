#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

use light_sdk::{
    account::LightAccount,
    address::v1::derive_address,
    cpi::{CpiAccounts, CpiInputs},
    instruction::{
        account_meta::CompressedAccountMeta, merkle_context::PackedAddressMerkleContext,
    },
    LightDiscriminator, LightHasher, NewAddressParamsPacked, ValidityProof,
};
declare_id!("6d5t24rpiABQaFbVxa6iyBj2fc38y7wFVUrKYYBX2nWi");

#[program]
pub mod counter {

    use super::*;

    pub fn create_counter<'info>(
        ctx: Context<'_, '_, '_, 'info, GenericAnchorAccounts<'info>>,
        proof: ValidityProof,
        address_merkle_context: PackedAddressMerkleContext,
        output_merkle_tree_index: u8,
    ) -> Result<()> {
        let program_id = crate::ID.into();
        let light_cpi_accounts = CpiAccounts::new(
            ctx.accounts.signer.as_ref(),
            ctx.remaining_accounts,
            crate::ID,
        )
        .map_err(ProgramError::from)?;

        let (address, address_seed) = derive_address(
            &[b"counter", ctx.accounts.signer.key().as_ref()],
            &light_cpi_accounts.tree_accounts()
                [address_merkle_context.address_merkle_tree_pubkey_index as usize]
                .key(),
            &crate::ID,
        );

        let new_address_params = NewAddressParamsPacked {
            seed: address_seed,
            address_queue_account_index: address_merkle_context.address_queue_pubkey_index,
            address_merkle_tree_root_index: address_merkle_context.root_index,
            address_merkle_tree_account_index: address_merkle_context
                .address_merkle_tree_pubkey_index,
        };

        let mut counter = LightAccount::<'_, CounterAccount>::new_init(
            &program_id,
            Some(address),
            output_merkle_tree_index,
        );

        counter.owner = ctx.accounts.signer.key();
        counter.value = 0;

        let cpi = CpiInputs::new_with_address(
            proof,
            vec![counter.to_account_info().map_err(ProgramError::from)?],
            vec![new_address_params],
        );
        cpi.invoke_light_system_program(light_cpi_accounts)
            .map_err(ProgramError::from)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct GenericAnchorAccounts<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
}

#[derive(
    Clone, Debug, Default, AnchorDeserialize, AnchorSerialize, LightDiscriminator, LightHasher,
)]
pub struct CounterAccount {
    #[hash]
    pub owner: Pubkey,
    pub value: u64,
}
