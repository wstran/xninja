use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Binary, Uint128};
use cw20::Denom;
use cw4::TOTAL_KEY;
use cw_controllers::{Admin, Claims, Hooks};
use cw_storage_plus::{Item, Map, SnapshotMap, Strategy};
use cw_utils::Duration;
use serde::{Deserialize, Serialize};

pub const CLAIMS: Claims = Claims::new("claims");

#[cw_serde]
pub struct Config {
    pub denom: Denom,
    pub denom_xnj: Denom,
    pub denom_elem: Denom,
    pub tokens_per_weight: Uint128,
    pub loan_rate: Uint128,
    pub min_borrow: Uint128,
    pub borrowing_period: bool,
    pub waiting_period: Duration,
    pub public_key: Binary,
}

pub const ADMIN: Admin = Admin::new("admin");
pub const HOOKS: Hooks = Hooks::new("cw4-hooks");
pub const CONFIG: Item<Config> = Item::new("config");
pub const TOTAL: Item<u64> = Item::new(TOTAL_KEY);

pub const MEMBERS: SnapshotMap<&Addr, u64> = SnapshotMap::new(
    cw4::MEMBERS_KEY,
    cw4::MEMBERS_CHECKPOINTS,
    cw4::MEMBERS_CHANGELOG,
    Strategy::EveryBlock,
);

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, Default)]
pub struct StakeInfo {
    pub total_inj_staked: Uint128,
    pub total_xnj_received: Uint128,
}

pub const STAKE_INFO: Map<&Addr, StakeInfo> = Map::new("stake_info");
