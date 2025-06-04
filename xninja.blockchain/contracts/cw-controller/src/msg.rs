use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::{Binary, Uint128, Uint64};
use cw20::{Cw20ReceiveMsg, Denom};
use cw_utils::Duration;

#[cw_serde]
pub struct InstantiateMsg {
    pub denom: Denom,
    pub denom_xnj: Denom,
    pub denom_elem: Denom,
    pub tokens_per_weight: Uint128,
    pub loan_rate: Uint128,
    pub min_borrow: Uint128,
    pub borrowing_period: bool,
    pub waiting_period: Duration,
    pub public_key: Binary,
    pub admin: Option<String>,
}

#[cw_serde]
pub enum ExecuteMsg {
    Borrow {
        inj_price_usd: Uint128,
        nonce: Uint64,
        timestamp: Uint64,
        signature: Binary,
    },
    Repay {
        nonce: Uint64,
        timestamp: Uint64,
        signature: Binary,
    },
    StopBorrow {},
    ConvertXnjToElem {
        nonce: Uint64,
        timestamp: Uint64,
        signature: Binary,
    },
    ConvertElemToXnj {
        nonce: Uint64,
        timestamp: Uint64,
        signature: Binary,
    },
    Claim {
        nonce: Uint64,
        timestamp: Uint64,
        signature: Binary,
    },
    ClaimElem {
        amount: Uint128,
        nonce: Uint64,
        timestamp: Uint64,
        signature: Binary,
    },
    UpdateConfigParams {
        denom: Denom,
        denom_xnj: Denom,
        denom_elem: Denom,
        tokens_per_weight: Uint128,
        loan_rate: Uint128,
        min_borrow: Uint128,
        borrowing_period: bool,
        waiting_period: Duration,
        public_key: Binary,
    },
    /// Change the admin
    UpdateAdmin {
        admin: Option<String>,
    },
    /// Add a new hook to be informed of all membership changes. Must be called by Admin
    AddHook {
        addr: String,
    },
    /// Remove a hook. Must be called by Admin
    RemoveHook {
        addr: String,
    },
    /// Change the mod
    UpdateMod {
        new_mod: String,
    },
    /// This accepts a properly-encoded ReceiveMsg from a cw20 contract
    Receive(Cw20ReceiveMsg),
    BurnToken {
        amount: Uint128,
    },
    AddToTreasury {
        target: String,
        amount: Uint128,
    },
    AddToTreasuryX {
        target: String,
        amount: Uint128,
    },
}

#[cw_serde]
pub enum ReceiveMsg {
    Repay {
        nonce: Uint64,
        timestamp: Uint64,
        signature: Binary,
    },
    ConvertXnjToElem {
        nonce: Uint64,
        timestamp: Uint64,
        signature: Binary,
    },
    ConvertElemToXnj {
        nonce: Uint64,
        timestamp: Uint64,
        signature: Binary,
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(StakedResponse)]
    Staked { address: String },
    #[returns(cw_controllers::ClaimsResponse)]
    Claims { address: String },
    #[returns(cw_controllers::AdminResponse)]
    Admin {},
    #[returns(cw4::TotalWeightResponse)]
    TotalWeight {},
    #[returns(cw4::MemberListResponse)]
    ListMembers {
        start_after: Option<String>,
        limit: Option<u32>,
    },
    #[returns(cw4::MemberResponse)]
    Member {
        addr: String,
        at_height: Option<u64>,
    },
    /// Shows all registered hooks.
    #[returns(cw_controllers::HooksResponse)]
    Hooks {},
}

#[cw_serde]
pub struct StakedResponse {
    pub total_inj_staked: Uint128,
    pub total_xnj_received: Uint128,
    pub denom: Denom,
}
