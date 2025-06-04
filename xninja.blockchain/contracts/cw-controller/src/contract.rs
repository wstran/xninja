#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
    coins, from_json, to_json_binary, Addr, BankMsg, Binary, Deps, DepsMut, Env, MessageInfo,
    Order, Response, StdError, StdResult, Storage, SubMsg, Uint128, Uint64, WasmMsg,
};

use sha2::{Digest, Sha256};

use cw2::set_contract_version;
use cw20::{Balance, Cw20CoinVerified, Cw20ExecuteMsg, Cw20ReceiveMsg, Denom};
use cw4::{
    Member, MemberChangedHookMsg, MemberDiff, MemberListResponse, MemberResponse,
    TotalWeightResponse,
};
use cw_storage_plus::Bound;
use cw_utils::{maybe_addr, Duration, NativeBalance};

use crate::error::ContractError;
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg, ReceiveMsg, StakedResponse};
use crate::state::{Config, StakeInfo, ADMIN, CLAIMS, CONFIG, HOOKS, MEMBERS, STAKE_INFO, TOTAL};

// version info for migration info
const CONTRACT_NAME: &str = "crates.io:cw-controller";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    mut deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    let api = deps.api;
    ADMIN.set(deps.branch(), maybe_addr(api, msg.admin)?)?;

    let min_borrow = std::cmp::max(msg.min_borrow, Uint128::new(1));

    let config = Config {
        denom: msg.denom,
        denom_xnj: msg.denom_xnj,
        denom_elem: msg.denom_elem,
        tokens_per_weight: msg.tokens_per_weight,
        loan_rate: msg.loan_rate,
        min_borrow,
        borrowing_period: msg.borrowing_period,
        waiting_period: msg.waiting_period,
        public_key: msg.public_key,
    };
    CONFIG.save(deps.storage, &config)?;
    TOTAL.save(deps.storage, &0)?;

    Ok(Response::new()
        .add_attribute("action", "instantiate")
        .add_attribute("loan_rate", msg.loan_rate.to_string())
        .add_attribute("waiting_period", format!("{:?}", msg.waiting_period)))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    let api = deps.api;
    match msg {
        ExecuteMsg::UpdateAdmin { admin } => {
            Ok(ADMIN.execute_update_admin(deps, info, maybe_addr(api, admin)?)?)
        }
        ExecuteMsg::UpdateMod { new_mod } => execute_update_mod(deps, info, new_mod),
        ExecuteMsg::AddHook { addr } => {
            Ok(HOOKS.execute_add_hook(&ADMIN, deps, info, api.addr_validate(&addr)?)?)
        }
        ExecuteMsg::RemoveHook { addr } => {
            Ok(HOOKS.execute_remove_hook(&ADMIN, deps, info, api.addr_validate(&addr)?)?)
        }
        ExecuteMsg::UpdateConfigParams {
            denom,
            denom_xnj,
            denom_elem,
            tokens_per_weight,
            loan_rate,
            min_borrow,
            borrowing_period,
            waiting_period,
            public_key,
        } => execute_update_config_params(
            deps,
            info,
            denom,
            denom_xnj,
            denom_elem,
            tokens_per_weight,
            loan_rate,
            min_borrow,
            borrowing_period,
            waiting_period,
            public_key,
        ),
        ExecuteMsg::Borrow {
            inj_price_usd,
            nonce,
            timestamp,
            signature,
        } => execute_borrow(
            deps,
            env,
            Balance::from(info.funds),
            info.sender,
            inj_price_usd,
            nonce,
            timestamp,
            signature,
        ),
        ExecuteMsg::Repay { .. } => Err(ContractError::ActionNotSupported),
        ExecuteMsg::ConvertXnjToElem { .. } | ExecuteMsg::ConvertElemToXnj { .. } => {
            Err(ContractError::ActionNotSupported)
        }
        ExecuteMsg::Claim {
            nonce,
            timestamp,
            signature,
        } => execute_claim(deps, env, info, nonce, timestamp, signature),
        ExecuteMsg::ClaimElem {
            amount,
            nonce,
            timestamp,
            signature,
        } => execute_claim_elem(deps, env, info.sender, amount, nonce, timestamp, signature),
        ExecuteMsg::StopBorrow {} => execute_stop_borrow(deps, env, info.sender),
        ExecuteMsg::Receive(msg) => execute_receive(deps, env, info, msg),
        ExecuteMsg::BurnToken { amount } => execute_burn_token(deps, info, amount),
        ExecuteMsg::AddToTreasury { target, amount } => {
            execute_add_to_treasury(deps, info, target, amount)
        }
        ExecuteMsg::AddToTreasuryX { target, amount } => {
            execute_add_to_treasury_x(deps, info, target, amount)
        }
    }
}

pub fn execute_borrow(
    deps: DepsMut,
    env: Env,
    amount: Balance,
    sender: Addr,
    inj_price_usd: Uint128,
    nonce: Uint64,
    timestamp: Uint64,
    signature: Binary,
) -> Result<Response, ContractError> {
    verify_nonce_and_timestamp(deps.storage, sender.clone(), nonce, timestamp, &env)?;

    let cfg = CONFIG.load(deps.storage)?;
    if !cfg.borrowing_period {
        return Err(ContractError::BorrowingDisabled);
    }
    let public_key = cfg.public_key.clone();
    let amount = match (&cfg.denom, &amount) {
        (Denom::Native(want), Balance::Native(have)) => must_pay_funds(have, want),
        (Denom::Cw20(want), Balance::Cw20(have)) => {
            if want == have.address {
                Ok(have.amount)
            } else {
                Err(ContractError::InvalidDenom(want.into()))
            }
        }
        _ => Err(ContractError::MixedNativeAndCw20(
            "Invalid address or denom".to_string(),
        )),
    }?;

    let message_hash = hash_message(&format!(
        "borrow:{}:{}:{}:{}:{}",
        sender, amount, inj_price_usd, nonce, timestamp
    ));

    let verification_result =
        verify_signature(deps.as_ref(), &message_hash, &signature, &public_key)?;

    if !verification_result {
        return Err(ContractError::InvalidSignature);
    }

    let loan_rate = cfg.loan_rate;
    let xnj_received = calculate_xnj_received(amount, inj_price_usd, loan_rate);

    let new_stake_info =
        STAKE_INFO.update(deps.storage, &sender, |opt_stake_info| -> StdResult<_> {
            let mut stake_info = opt_stake_info.unwrap_or_default();
            stake_info.total_inj_staked += amount;
            stake_info.total_xnj_received += xnj_received;
            Ok(stake_info)
        })?;

    let messages = update_membership(
        deps.storage,
        sender.clone(),
        new_stake_info.total_inj_staked,
        &cfg,
        env.block.height,
    )?;

    let xnj_token_address = match cfg.denom_xnj {
        Denom::Cw20(ref address) => address,
        _ => {
            return Err(ContractError::InvalidDenom(
                "Denom for XNJ is not configured as CW20".to_string(),
            ))
        }
    };

    let transfer_msg = Cw20ExecuteMsg::Transfer {
        recipient: sender.clone().to_string(),
        amount: xnj_received,
    };

    let cw20_execute_msg = WasmMsg::Execute {
        contract_addr: xnj_token_address.to_string(),
        msg: to_json_binary(&transfer_msg)?,
        funds: vec![],
    };

    Ok(Response::new()
        .add_messages(vec![cw20_execute_msg])
        .add_submessages(messages)
        .add_attribute("action", "borrow")
        .add_attribute("amount", amount)
        .add_attribute("recipient", sender))
}

pub fn execute_stop_borrow(
    deps: DepsMut,
    _env: Env,
    sender: Addr,
) -> Result<Response, ContractError> {
    ADMIN.assert_admin(deps.as_ref(), &sender)?;
    let mut cfg = CONFIG.load(deps.storage)?;
    cfg.borrowing_period = false;
    CONFIG.save(deps.storage, &cfg)?;

    let member_addresses: Result<Vec<Addr>, ContractError> = MEMBERS
        .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .map(|result| {
            result
                .map(|(member_addr, _weight)| member_addr)
                .map_err(|_| ContractError::ResetFailed("Iteration failed".to_string()))
        })
        .collect();

    for member_addr in member_addresses? {
        STAKE_INFO.save(
            deps.storage,
            &member_addr,
            &StakeInfo {
                total_inj_staked: Uint128::zero(),
                total_xnj_received: Uint128::zero(),
            },
        )?;
    }

    Ok(Response::new().add_attribute("action", "stop_borrow"))
}

pub fn execute_repay(
    deps: DepsMut,
    env: Env,
    amount: Balance,
    sender: Addr,
    nonce: Uint64,
    timestamp: Uint64,
    signature: Binary,
) -> Result<Response, ContractError> {
    verify_nonce_and_timestamp(deps.storage, sender.clone(), nonce, timestamp, &env)?;
    let cfg = CONFIG.load(deps.storage)?;
    let public_key = cfg.public_key.clone();
    let xnj_amount = match &amount {
        Balance::Cw20(have) => match &cfg.denom_xnj {
            Denom::Cw20(expected_addr) => {
                if have.address == expected_addr {
                    Ok(have.amount)
                } else {
                    Err(ContractError::InvalidDenom(format!(
                        "Expected ELEM tokens, got: {}",
                        have.address
                    )))
                }
            }
            _ => Err(ContractError::InvalidDenom(
                "Configuration for denom_xnj is not a CW20 token".to_string(),
            )),
        },
        _ => Err(ContractError::InvalidDenom(
            "Expected ELEM tokens".to_string(),
        )),
    }?;

    let message_hash = hash_message(&format!(
        "repay:{}:{}:{}:{}",
        sender, xnj_amount, nonce, timestamp
    ));

    let verification_result =
        verify_signature(deps.as_ref(), &message_hash, &signature, &public_key)?;

    if !verification_result {
        return Err(ContractError::InvalidSignature);
    }

    let mut stake_info = STAKE_INFO.load(deps.storage, &sender)?;
    if xnj_amount > stake_info.total_xnj_received {
        return Err(ContractError::InsufficientXNJ {});
    }

    if stake_info.total_xnj_received.is_zero() || stake_info.total_inj_staked.is_zero() {
        return Err(ContractError::InvalidOperation(
            "Cannot repay without any stakes".to_string(),
        ));
    }

    let xnj_ratio = xnj_amount.u128() as f64 / stake_info.total_xnj_received.u128() as f64;
    let inj_to_return = (xnj_ratio * stake_info.total_inj_staked.u128() as f64) as u128;

    stake_info.total_xnj_received -= xnj_amount;
    stake_info.total_inj_staked -= Uint128::from(inj_to_return);

    STAKE_INFO.save(deps.storage, &sender, &stake_info)?;

    // Directly send the repayment to the user
    let message = match &cfg.denom {
        Denom::Native(denom) => {
            let amount = coins(inj_to_return, denom);
            SubMsg::new(BankMsg::Send {
                to_address: sender.to_string(),
                amount,
            })
        }
        Denom::Cw20(addr) => {
            let transfer = Cw20ExecuteMsg::Transfer {
                recipient: sender.to_string(),
                amount: xnj_amount,
            };
            SubMsg::new(WasmMsg::Execute {
                contract_addr: addr.into(),
                msg: to_json_binary(&transfer)?,
                funds: vec![],
            })
        }
    };

    let messages = update_membership(
        deps.storage,
        sender.clone(),
        stake_info.total_inj_staked,
        &cfg,
        env.block.height,
    )?;

    Ok(Response::new()
        .add_submessages(messages)
        .add_submessage(message)
        .add_attribute("action", "repay")
        .add_attribute("amount", amount.to_string())
        .add_attribute("sender", sender.to_string()))
}

pub fn execute_convert_xnj_to_elem(
    deps: DepsMut,
    env: Env,
    amount: Balance,
    sender: Addr,
    nonce: Uint64,
    timestamp: Uint64,
    signature: Binary,
) -> Result<Response, ContractError> {
    verify_nonce_and_timestamp(deps.storage, sender.clone(), nonce, timestamp, &env)?;
    let cfg = CONFIG.load(deps.storage)?;
    let public_key = cfg.public_key.clone();

    let xnj_amount = match &amount {
        Balance::Cw20(have) => match &cfg.denom_xnj {
            Denom::Cw20(expected_addr) => {
                if have.address == expected_addr {
                    Ok(have.amount)
                } else {
                    Err(ContractError::InvalidDenom(format!(
                        "Expected ELEM tokens, got: {}",
                        have.address
                    )))
                }
            }
            _ => Err(ContractError::InvalidDenom(
                "Configuration for denom_xnj is not a CW20 token".to_string(),
            )),
        },
        _ => Err(ContractError::InvalidDenom(
            "Expected ELEM tokens".to_string(),
        )),
    }?;

    let message_hash = hash_message(&format!(
        "xtoe:{}:{}:{}:{}",
        sender, xnj_amount, nonce, timestamp
    ));

    let verification_result =
        verify_signature(deps.as_ref(), &message_hash, &signature, &public_key)?;

    if !verification_result {
        return Err(ContractError::InvalidSignature);
    }

    let elem_token_contract_addr = match cfg.denom_elem {
        Denom::Cw20(ref address) => address,
        _ => {
            return Err(ContractError::InvalidDenom(
                "ELEM denomination is not a CW20 token".to_string(),
            ))
        }
    };

    let mint_msg = Cw20ExecuteMsg::Mint {
        recipient: sender.to_string(),
        amount: xnj_amount,
    };

    let cw20_execute_msg = WasmMsg::Execute {
        contract_addr: elem_token_contract_addr.to_string(),
        msg: to_json_binary(&mint_msg)?,
        funds: vec![],
    };

    Ok(Response::new()
        .add_message(cw20_execute_msg)
        .add_attribute("action", "convert_xnj_to_elem")
        .add_attribute("amount", xnj_amount.to_string())
        .add_attribute("sender", sender.to_string()))
}

pub fn execute_convert_elem_to_xnj(
    deps: DepsMut,
    env: Env,
    amount: Balance,
    sender: Addr,
    nonce: Uint64,
    timestamp: Uint64,
    signature: Binary,
) -> Result<Response, ContractError> {
    verify_nonce_and_timestamp(deps.storage, sender.clone(), nonce, timestamp, &env)?;
    let cfg = CONFIG.load(deps.storage)?;
    let public_key = cfg.public_key.clone();

    let elem_amount = match &amount {
        Balance::Cw20(have) => match &cfg.denom_elem {
            Denom::Cw20(expected_addr) => {
                if have.address == expected_addr {
                    Ok(have.amount)
                } else {
                    Err(ContractError::InvalidDenom(format!(
                        "Expected ELEM tokens, got: {}",
                        have.address
                    )))
                }
            }
            _ => Err(ContractError::InvalidDenom(
                "Configuration for denom_elem is not a CW20 token".to_string(),
            )),
        },
        _ => Err(ContractError::InvalidDenom(
            "Expected ELEM tokens".to_string(),
        )),
    }?;

    let message_hash = hash_message(&format!(
        "etox:{}:{}:{}:{}",
        sender, elem_amount, nonce, timestamp
    ));

    let verification_result =
        verify_signature(deps.as_ref(), &message_hash, &signature, &public_key)?;

    if !verification_result {
        return Err(ContractError::InvalidSignature);
    }

    CLAIMS.create_claim(
        deps.storage,
        &sender,
        elem_amount,
        cfg.waiting_period.after(&env.block),
    )?;

    Ok(Response::new()
        .add_attribute("action", "convert_elem_to_xnj")
        .add_attribute("amount", elem_amount.to_string())
        .add_attribute("sender", sender.to_string()))
}

pub fn execute_burn_token(
    deps: DepsMut,
    info: MessageInfo,
    amount_to_burn: Uint128,
) -> Result<Response, ContractError> {
    ADMIN.assert_admin(deps.as_ref(), &info.sender)?;
    let cfg = CONFIG.load(deps.storage)?;

    let elem_token_contract_addr = match cfg.denom_elem {
        Denom::Cw20(ref address) => address,
        _ => {
            return Err(ContractError::InvalidDenom(
                "ELEM denomination is not a CW20 token".to_string(),
            ))
        }
    };

    let burn_msg = Cw20ExecuteMsg::Burn {
        amount: amount_to_burn,
    };

    let execute_message_burn = WasmMsg::Execute {
        contract_addr: elem_token_contract_addr.to_string(),
        msg: to_json_binary(&burn_msg)?,
        funds: vec![],
    };

    Ok(Response::new()
        .add_message(execute_message_burn)
        .add_attribute("action", "burn_elem")
        .add_attribute("amount_to_burn", amount_to_burn.to_string())
        .add_attribute(
            "elem_token_contract_addr",
            elem_token_contract_addr.to_string(),
        ))
}

pub fn execute_claim(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    nonce: Uint64,
    timestamp: Uint64,
    signature: Binary,
) -> Result<Response, ContractError> {
    verify_nonce_and_timestamp(
        deps.storage,
        info.sender.clone().into(),
        nonce,
        timestamp,
        &env,
    )?;
    let cfg = CONFIG.load(deps.storage)?;
    let public_key = cfg.public_key.clone();

    let release = CLAIMS.claim_tokens(deps.storage, &info.sender, &env.block, None)?;
    if release.is_zero() {
        return Err(ContractError::NothingToClaim {});
    }

    let (amount_str, message) = match &cfg.denom_xnj {
        Denom::Native(denom) => {
            let amount_str = coin_to_string(release, denom.as_str());
            let amount = coins(release.u128(), denom);
            let message = SubMsg::new(BankMsg::Send {
                to_address: info.sender.to_string(),
                amount,
            });
            (amount_str, message)
        }
        Denom::Cw20(addr) => {
            let amount_str = coin_to_string(release, addr.as_str());
            let transfer = Cw20ExecuteMsg::Transfer {
                recipient: info.sender.clone().into(),
                amount: release,
            };
            let message = SubMsg::new(WasmMsg::Execute {
                contract_addr: addr.into(),
                msg: to_json_binary(&transfer)?,
                funds: vec![],
            });
            (amount_str, message)
        }
    };

    let message_hash = hash_message(&format!(
        "eclaim:{}:{}:{}:{}",
        &info.sender.clone(),
        release,
        nonce,
        timestamp
    ));

    let verification_result =
        verify_signature(deps.as_ref(), &message_hash, &signature, &public_key)?;

    if !verification_result {
        return Err(ContractError::InvalidSignature);
    }

    Ok(Response::new()
        .add_submessage(message)
        .add_attribute("action", "claim")
        .add_attribute("tokens", amount_str)
        .add_attribute("sender", info.sender))
}

pub fn execute_claim_elem(
    deps: DepsMut,
    env: Env,
    sender: Addr,
    _amount: Uint128,
    nonce: Uint64,
    timestamp: Uint64,
    signature: Binary,
) -> Result<Response, ContractError> {
    verify_nonce_and_timestamp(deps.storage, sender.clone(), nonce, timestamp, &env)?;

    let cfg = CONFIG.load(deps.storage)?;
    let public_key = cfg.public_key.clone();
    let message_hash = hash_message(&format!(
        "claim_elem:{}:{}:{}:{}",
        sender, _amount, nonce, timestamp
    ));

    let verification_result =
        verify_signature(deps.as_ref(), &message_hash, &signature, &public_key)?;

    if !verification_result {
        return Err(ContractError::InvalidSignature);
    }

    let elem_token_contract_addr = match cfg.denom_elem {
        Denom::Cw20(ref address) => address,
        _ => {
            return Err(ContractError::InvalidDenom(
                "ELEM denomination is not a CW20 token".to_string(),
            ))
        }
    };

    let mint_msg = Cw20ExecuteMsg::Mint {
        recipient: sender.to_string(),
        amount: _amount,
    };

    let cw20_execute_msg = WasmMsg::Execute {
        contract_addr: elem_token_contract_addr.to_string(),
        msg: to_json_binary(&mint_msg)?,
        funds: vec![],
    };

    Ok(Response::new()
        .add_message(cw20_execute_msg)
        .add_attribute("action", "claim_elem")
        .add_attribute("tokens", _amount.to_string())
        .add_attribute("sender", sender))
}

pub fn execute_receive(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    wrapper: Cw20ReceiveMsg,
) -> Result<Response, ContractError> {
    let msg: ReceiveMsg = from_json(&wrapper.msg)?;
    let balance = Balance::Cw20(Cw20CoinVerified {
        address: info.sender,
        amount: wrapper.amount,
    });
    let api = deps.api;
    match msg {
        ReceiveMsg::Repay {
            nonce,
            timestamp,
            signature,
        } => execute_repay(
            deps,
            env,
            balance,
            api.addr_validate(&wrapper.sender)?,
            nonce,
            timestamp,
            signature,
        ),
        ReceiveMsg::ConvertXnjToElem {
            nonce,
            timestamp,
            signature,
        } => execute_convert_xnj_to_elem(
            deps,
            env,
            balance,
            api.addr_validate(&wrapper.sender)?,
            nonce,
            timestamp,
            signature,
        ),
        ReceiveMsg::ConvertElemToXnj {
            nonce,
            timestamp,
            signature,
        } => execute_convert_elem_to_xnj(
            deps,
            env,
            balance,
            api.addr_validate(&wrapper.sender)?,
            nonce,
            timestamp,
            signature,
        ),
    }
}

pub fn must_pay_funds(balance: &NativeBalance, denom: &str) -> Result<Uint128, ContractError> {
    match balance.0.len() {
        0 => Err(ContractError::NoFunds {}),
        1 => {
            let balance = &balance.0;
            let payment = balance[0].amount;
            if balance[0].denom == denom {
                Ok(payment)
            } else {
                Err(ContractError::MissingDenom(denom.to_string()))
            }
        }
        _ => Err(ContractError::ExtraDenoms(denom.to_string())),
    }
}

fn update_membership(
    storage: &mut dyn Storage,
    sender: Addr,
    new_stake: Uint128,
    cfg: &Config,
    height: u64,
) -> StdResult<Vec<SubMsg>> {
    // update their membership weight
    let new = calc_weight(new_stake, cfg);
    let old = MEMBERS.may_load(storage, &sender)?;

    // short-circuit if no change
    if new == old {
        return Ok(vec![]);
    }
    // otherwise, record change of weight
    match new.as_ref() {
        Some(w) => MEMBERS.save(storage, &sender, w, height),
        None => MEMBERS.remove(storage, &sender, height),
    }?;

    // update total
    TOTAL.update(storage, |total| -> StdResult<_> {
        Ok(total + new.unwrap_or_default() - old.unwrap_or_default())
    })?;

    // alert the hooks
    let diff = MemberDiff::new(sender, old, new);
    HOOKS.prepare_hooks(storage, |h| {
        MemberChangedHookMsg::one(diff.clone())
            .into_cosmos_msg(h)
            .map(SubMsg::new)
    })
}

fn execute_add_to_treasury_x(
    deps: DepsMut,
    info: MessageInfo,
    target: String,
    amount: Uint128,
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;
    ADMIN.assert_admin(deps.as_ref(), &info.sender)?;

    let xnj_token_address = match cfg.denom_xnj {
        Denom::Cw20(ref address) => address,
        _ => {
            return Err(ContractError::InvalidDenom(
                "Denom for XNJ is not configured as CW20".to_string(),
            ))
        }
    };

    let transfer_msg = Cw20ExecuteMsg::Transfer {
        recipient: target.clone(),
        amount,
    };

    let cw20_execute_msg = WasmMsg::Execute {
        contract_addr: xnj_token_address.to_string(),
        msg: to_json_binary(&transfer_msg)?,
        funds: vec![],
    };

    Ok(Response::new()
        .add_message(cw20_execute_msg)
        .add_attribute("action", "add_to_treasury_x")
        .add_attribute("target", target.clone())
        .add_attribute("amount", amount.to_string()))
}

fn execute_add_to_treasury(
    deps: DepsMut,
    info: MessageInfo,
    target: String,
    amount: Uint128,
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;
    ADMIN.assert_admin(deps.as_ref(), &info.sender)?;
    let denom_str = match cfg.denom {
        Denom::Native(ref denom_string) => denom_string.clone(),
        Denom::Cw20(ref addr) => addr.to_string(),
    };
    let coin_amount = coins(amount.u128(), denom_str);

    let execute_msg = SubMsg::new(BankMsg::Send {
        to_address: target.clone(),
        amount: coin_amount.clone(),
    });

    let amount_str = format!("{}", amount);

    Ok(Response::new()
        .add_submessage(execute_msg)
        .add_attribute("action", "add_to_treasury")
        .add_attribute("target", target)
        .add_attribute("amount", amount_str))
}

fn execute_update_mod(
    deps: DepsMut,
    info: MessageInfo,
    new_mod: String,
) -> Result<Response, ContractError> {
    ADMIN.assert_admin(deps.as_ref(), &info.sender)?;

    let cfg = CONFIG.load(deps.storage)?;

    let elem_token_contract_addr = match cfg.denom_elem {
        Denom::Cw20(ref address) => address,
        _ => {
            return Err(ContractError::InvalidDenom(
                "ELEM denomination is not a CW20 token".to_string(),
            ))
        }
    };

    let msg = Cw20ExecuteMsg::UpdateMinter {
        new_minter: Some(new_mod.clone()),
    };
    let wasm_msg = WasmMsg::Execute {
        contract_addr: elem_token_contract_addr.to_string(),
        msg: to_json_binary(&msg)?,
        funds: vec![],
    };

    Ok(Response::new()
        .add_message(wasm_msg)
        .add_attribute("action", "update_mod")
        .add_attribute("new_mod", new_mod))
}

fn execute_update_config_params(
    deps: DepsMut,
    info: MessageInfo,
    denom: Denom,
    denom_xnj: Denom,
    denom_elem: Denom,
    tokens_per_weight: Uint128,
    loan_rate: Uint128,
    min_borrow: Uint128,
    borrowing_period: bool,
    waiting_period: Duration,
    public_key: Binary,
) -> Result<Response, ContractError> {
    ADMIN.assert_admin(deps.as_ref(), &info.sender)?;

    let mut cfg = CONFIG.load(deps.storage)?;

    cfg.denom = denom.clone();
    cfg.denom_xnj = denom_xnj.clone();
    cfg.denom_elem = denom_elem.clone();
    cfg.tokens_per_weight = tokens_per_weight;
    cfg.loan_rate = loan_rate;
    cfg.min_borrow = min_borrow;
    cfg.borrowing_period = borrowing_period;
    cfg.waiting_period = waiting_period;
    cfg.public_key = public_key;

    CONFIG.save(deps.storage, &cfg)?;

    Ok(Response::new()
        .add_attribute("action", "update_conversion_params")
        .add_attribute("denom", format!("{:?}", denom))
        .add_attribute("denom_xnj", format!("{:?}", denom_xnj))
        .add_attribute("denom_elem", format!("{:?}", denom_elem))
        .add_attribute("tokens_per_weight", tokens_per_weight.to_string())
        .add_attribute("loan_rate", loan_rate.to_string())
        .add_attribute("min_borrow", min_borrow.to_string())
        .add_attribute("borrowing_period", borrowing_period.to_string())
        .add_attribute("waiting_period", format!("{:?}", waiting_period)))
}

fn calc_weight(stake: Uint128, cfg: &Config) -> Option<u64> {
    if stake < cfg.min_borrow {
        None
    } else {
        let w = stake.u128() / (cfg.tokens_per_weight.u128());
        Some(w as u64)
    }
}

fn calculate_xnj_received(
    inj_amount: Uint128,
    inj_price_usd: Uint128,
    loan_rate: Uint128,
) -> Uint128 {
    let xnj_price_usd_scaled = Uint128::from(5u128);
    let usd_value_of_inj_scaled = inj_amount * inj_price_usd;

    let usd_value_after_loan_rate = usd_value_of_inj_scaled * loan_rate / Uint128::from(100u128);

    let xnj_received = usd_value_after_loan_rate / xnj_price_usd_scaled;

    xnj_received
}

fn verify_nonce_and_timestamp(
    storage: &mut dyn Storage,
    sender: Addr,
    nonce: Uint64,
    timestamp: Uint64,
    env: &Env,
) -> StdResult<()> {
    let nonce_key = format!("nonce_{}_{}", sender, nonce);

    if storage.get(nonce_key.as_bytes()).is_some() {
        return Err(StdError::generic_err("Nonce has already been used"));
    }

    storage.set(nonce_key.as_bytes(), &[0x01]);

    let current_timestamp = env.block.time.seconds();
    let timestamp_u64 = timestamp.u64();
    if timestamp_u64 < current_timestamp.saturating_sub(300)
        || timestamp_u64 > current_timestamp.saturating_add(300)
    {
        return Err(StdError::generic_err(
            "Timestamp is not within the acceptable range",
        ));
    }

    Ok(())
}

fn verify_signature(
    deps: Deps,
    message: &[u8],
    signature: &Binary,
    public_key: &[u8],
) -> StdResult<bool> {
    match deps.api.secp256k1_verify(message, &signature.0, public_key) {
        Ok(verification_result) => Ok(verification_result),
        Err(_) => Err(StdError::generic_err("Signature verification failed")),
    }
}

fn hash_message(message: &str) -> Vec<u8> {
    let mut hasher = Sha256::new();
    hasher.update(message);
    hasher.finalize().to_vec()
}
#[inline]
fn coin_to_string(amount: Uint128, denom: &str) -> String {
    format!("{amount} {denom}")
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Member {
            addr,
            at_height: height,
        } => to_json_binary(&query_member(deps, addr, height)?),
        QueryMsg::ListMembers { start_after, limit } => {
            to_json_binary(&list_members(deps, start_after, limit)?)
        }
        QueryMsg::TotalWeight {} => to_json_binary(&query_total_weight(deps)?),
        QueryMsg::Staked { address } => to_json_binary(&query_staked(deps, address)?),
        QueryMsg::Claims { address } => {
            to_json_binary(&CLAIMS.query_claims(deps, &deps.api.addr_validate(&address)?)?)
        }
        QueryMsg::Admin {} => to_json_binary(&ADMIN.query_admin(deps)?),
        QueryMsg::Hooks {} => to_json_binary(&HOOKS.query_hooks(deps)?),
    }
}

fn query_total_weight(deps: Deps) -> StdResult<TotalWeightResponse> {
    let weight = TOTAL.load(deps.storage)?;
    Ok(TotalWeightResponse { weight })
}

pub fn query_staked(deps: Deps, addr: String) -> StdResult<StakedResponse> {
    let addr = deps.api.addr_validate(&addr)?;
    let stake_info = STAKE_INFO
        .may_load(deps.storage, &addr)?
        .unwrap_or_default();
    let cfg = CONFIG.load(deps.storage)?;

    Ok(StakedResponse {
        total_inj_staked: stake_info.total_inj_staked,
        total_xnj_received: stake_info.total_xnj_received,
        denom: cfg.denom,
    })
}

fn query_member(deps: Deps, addr: String, height: Option<u64>) -> StdResult<MemberResponse> {
    let addr = deps.api.addr_validate(&addr)?;
    let weight = match height {
        Some(h) => MEMBERS.may_load_at_height(deps.storage, &addr, h),
        None => MEMBERS.may_load(deps.storage, &addr),
    }?;
    Ok(MemberResponse { weight })
}

// settings for pagination
const MAX_LIMIT: u32 = 30;
const DEFAULT_LIMIT: u32 = 10;

fn list_members(
    deps: Deps,
    start_after: Option<String>,
    limit: Option<u32>,
) -> StdResult<MemberListResponse> {
    let limit = limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT) as usize;
    let addr = maybe_addr(deps.api, start_after)?;
    let start = addr.as_ref().map(Bound::exclusive);

    let members = MEMBERS
        .range(deps.storage, start, None, Order::Ascending)
        .take(limit)
        .map(|item| {
            item.map(|(addr, weight)| Member {
                addr: addr.into(),
                weight,
            })
        })
        .collect::<StdResult<_>>()?;

    Ok(MemberListResponse { members })
}

#[cfg(test)]
mod tests {
    use crate::error::ContractError;
    use cosmwasm_std::testing::{
        mock_dependencies, mock_dependencies_with_balance, mock_env, mock_info,
    };
    use cosmwasm_std::{from_json, to_json_binary, Api, CosmosMsg, Storage};
    use cw20::Denom;
    use cw_utils::{Duration, NativeBalance};

    use super::*;

    const INIT_ADMIN: &str = "juan";
    const USER1: &str = "somebody";
    const DENOM: &str = "stake";
    const TOKENS_PER_WEIGHT: Uint128 = Uint128::new(1_000);
    const LOAN_RATE: Uint128 = Uint128::new(85);
    const MIN_BORROW: Uint128 = Uint128::new(5_000);
    const BORROWING_PERIOD: bool = true;
    const UNBONDING_BLOCKS: u64 = 100;
    const CW20_ADDRESS: &str = "wasm1234567890";

    fn mock_public_key() -> Binary {
        Binary::from(vec![1, 2, 3, 4, 5])
    }

    fn default_instantiate(deps: DepsMut) {
        let public_key = mock_public_key();

        do_instantiate(
            deps,
            TOKENS_PER_WEIGHT,
            LOAN_RATE,
            MIN_BORROW,
            BORROWING_PERIOD,
            Duration::Height(UNBONDING_BLOCKS),
            Duration::Height(UNBONDING_BLOCKS),
            public_key,
        )
    }

    fn do_instantiate(
        deps: DepsMut,
        tokens_per_weight: Uint128,
        loan_rate: Uint128,
        min_borrow: Uint128,
        borrowing_period: bool,
        waiting_period: Duration,
        public_key: Binary,
    ) {
        let msg = InstantiateMsg {
            denom: Denom::Native("stake".to_string()),
            denom_xnj: Denom::Cw20(Addr::unchecked(CW20_ADDRESS)),
            denom_elem: Denom::Cw20(Addr::unchecked(CW20_ADDRESS)),
            tokens_per_weight,
            loan_rate,
            min_borrow,
            borrowing_period,
            waiting_period,
            public_key,
            admin: Some(INIT_ADMIN.into()),
        };
        let info = mock_info("creator", &[]);
        instantiate(deps, mock_env(), info, msg).unwrap();
    }

    fn instantiate_contract(deps: DepsMut) {
        let msg = InstantiateMsg {
            admin: Some(INIT_ADMIN.into()),
            denom: Denom::Native("stake".to_string()),
            denom_xnj: Denom::Cw20(Addr::unchecked("xnj_token")),
            denom_elem: Denom::Cw20(Addr::unchecked("elem_token")),
            tokens_per_weight: Uint128::new(1000),
            loan_rate: Uint128::new(85),
            min_borrow: Uint128::new(5000),
            borrowing_period: true,
            waiting_period: Duration::Height(100),
            public_key: Binary::from(vec![1, 2, 3, 4, 5]),
        };
        let info = mock_info("creator", &[]);
        let _ =
            instantiate(deps, mock_env(), info, msg).expect("contract successfully instantiated");
    }

    fn mock_execute_borrow(
        deps: DepsMut,
        env: Env,
        sender: &str,
        amount: Uint128,
        inj_price_usd: Uint128,
        nonce: u64,
        timestamp: u64,
        signature: Binary,
    ) -> Result<Response, ContractError> {
        let sender_addr = Addr::unchecked(sender);

        execute_borrow(
            deps,
            env,
            Balance::Native(NativeBalance(coins(amount.u128(), DENOM))),
            sender_addr,
            inj_price_usd,
            nonce.into(),
            timestamp.into(),
            signature,
        )
    }

    #[test]
    fn test_borrow_not_from_backend_app() {
        let mut deps = mock_dependencies();
        let env = mock_env();

        default_instantiate(deps.as_mut());

        let sender = USER1;
        let amount = Uint128::new(500);
        let inj_price_usd = Uint128::new(100);
        let nonce = 1u64;
        let timestamp = env.block.time.seconds();
        let signature = mock_public_key();

        let res = mock_execute_borrow(
            deps.as_mut(),
            env,
            sender,
            amount,
            inj_price_usd,
            nonce,
            timestamp,
            signature,
        );

        assert!(
            res.is_err(),
            "Expected verification to fail due to invalid signature"
        );
    }

    fn mock_execute_claim_elem(
        deps: DepsMut,
        env: Env,
        sender: &str,
        amount: Uint128,
        nonce: u64,
        timestamp: u64,
        signature: Binary,
    ) -> Result<Response, ContractError> {
        let sender_addr = Addr::unchecked(sender);

        execute_claim_elem(
            deps,
            env,
            sender_addr,
            amount,
            nonce.into(),
            timestamp.into(),
            signature,
        )
    }

    #[test]
    fn test_claim_elem_not_from_backend_app() {
        let mut deps = mock_dependencies();
        let env = mock_env();

        default_instantiate(deps.as_mut());

        let sender = USER1;
        let amount = Uint128::new(500);
        let nonce = 1u64;
        let timestamp = env.block.time.seconds();
        let signature = mock_public_key();

        let res = mock_execute_claim_elem(
            deps.as_mut(),
            env,
            sender,
            amount,
            nonce,
            timestamp,
            signature,
        );

        assert!(
            res.is_err(),
            "Expected verification to fail due to invalid signature"
        );
    }

    #[test]
    fn test_calculate_xnj_received() {
        let inj_amount = Uint128::new(1000);
        let inj_price_usd = Uint128::new(2); // Example: 1 INJ = 2 USD
        let loan_rate = Uint128::new(90); // Example: 90%

        let xnj_received = calculate_xnj_received(inj_amount, inj_price_usd, loan_rate);

        let expected_xnj_received = Uint128::new(1800 / 5);
        assert_eq!(
            xnj_received, expected_xnj_received,
            "XNJ received calculation did not match expected value"
        );
    }

    #[test]
    fn test_verify_nonce_and_timestamp() {
        let mut deps = mock_dependencies();
        let env = mock_env();
        let sender = Addr::unchecked("sender");

        // Test unused nonce and valid timestamp
        let nonce = Uint64::new(1);
        let timestamp = env.block.time.seconds();
        assert!(
            verify_nonce_and_timestamp(
                deps.as_mut().storage,
                sender.clone(),
                nonce,
                Uint64::from(timestamp),
                &env
            )
            .is_ok(),
            "Should succeed for unused nonce and valid timestamp"
        );

        // Simulate nonce usage
        let nonce_key = format!("nonce_{}_{}", sender, nonce);
        deps.storage.set(nonce_key.as_bytes(), &[0x01]);

        // Test used nonce
        assert!(
            verify_nonce_and_timestamp(
                deps.as_mut().storage,
                sender.clone(),
                nonce,
                Uint64::from(timestamp),
                &env
            )
            .is_err(),
            "Should fail for used nonce"
        );

        // Test invalid timestamp
        let invalid_timestamp = env.block.time.seconds() + 301; // Outside the acceptable range
        let new_nonce = Uint64::new(2); // New nonce to bypass the used nonce check
        assert!(
            verify_nonce_and_timestamp(
                deps.as_mut().storage,
                sender,
                new_nonce,
                Uint64::from(invalid_timestamp),
                &env
            )
            .is_err(),
            "Should fail for invalid timestamp"
        );
    }

    #[test]
    fn test_calc_weight_stake_less_than_min_borrow() {
        let stake = Uint128::new(50);

        let cfg = Config {
            denom: Denom::Native("stake".to_string()),
            denom_xnj: Denom::Cw20(Addr::unchecked("xnj_token")),
            denom_elem: Denom::Cw20(Addr::unchecked("elem_token")),
            tokens_per_weight: Uint128::new(10),
            loan_rate: Uint128::new(85),
            min_borrow: Uint128::new(100),
            borrowing_period: true,
            waiting_period: Duration::Height(100),
            public_key: Binary::from(vec![1, 2, 3, 4, 5]),
        };

        assert_eq!(calc_weight(stake, &cfg), None);
    }

    #[test]
    fn test_calc_weight_stake_equal_to_min_borrow() {
        let stake = Uint128::new(100);
        let cfg = Config {
            denom: Denom::Native("stake".to_string()),
            denom_xnj: Denom::Cw20(Addr::unchecked("xnj_token")),
            denom_elem: Denom::Cw20(Addr::unchecked("elem_token")),
            tokens_per_weight: Uint128::new(10),
            loan_rate: Uint128::new(85),
            min_borrow: Uint128::new(100),
            borrowing_period: true,
            waiting_period: Duration::Height(100),
            public_key: Binary::from(vec![1, 2, 3, 4, 5]),
        };

        assert_eq!(calc_weight(stake, &cfg), Some(10));
    }

    #[test]
    fn test_calc_weight_stake_greater_than_min_borrow() {
        let stake = Uint128::new(150);
        let cfg = Config {
            denom: Denom::Native("stake".to_string()),
            denom_xnj: Denom::Cw20(Addr::unchecked("xnj_token")),
            denom_elem: Denom::Cw20(Addr::unchecked("elem_token")),
            tokens_per_weight: Uint128::new(10),
            loan_rate: Uint128::new(85),
            min_borrow: Uint128::new(100),
            borrowing_period: true,
            waiting_period: Duration::Height(100),
            public_key: Binary::from(vec![1, 2, 3, 4, 5]),
        };

        assert_eq!(calc_weight(stake, &cfg), Some(15));
    }

    #[test]
    fn test_execute_update_config_params() {
        let mut deps = mock_dependencies();
        instantiate_contract(deps.as_mut());

        // Assuming the admin trying to update config is INIT_ADMIN
        let info = mock_info(INIT_ADMIN, &[]);

        let new_tokens_per_weight = Uint128::new(2000);
        let new_loan_rate = Uint128::new(75);
        let new_min_borrow = Uint128::new(6000);
        let new_borrowing_period = true;
        let new_waiting_period = Duration::Height(150);
        let new_public_key = Binary::from(vec![6, 7, 8, 9, 10]);

        // Execute the update config params function
        let res = execute_update_config_params(
            deps.as_mut(),
            info,
            Denom::Native("stake".to_string()),
            Denom::Cw20(Addr::unchecked("new_xnj_address")),
            Denom::Cw20(Addr::unchecked("new_elem_address")),
            new_tokens_per_weight,
            new_loan_rate,
            new_min_borrow,
            new_borrowing_period,
            new_waiting_period,
            new_public_key.clone(),
        );

        assert!(res.is_ok(), "Should succeed with admin privileges");

        // Fetch and verify the updated config
        let config = CONFIG.load(deps.as_ref().storage).unwrap();
        assert_eq!(
            config.tokens_per_weight, new_tokens_per_weight,
            "tokens_per_weight should be updated"
        );
        assert_eq!(
            config.loan_rate, new_loan_rate,
            "loan_rate should be updated"
        );
        assert_eq!(
            config.min_borrow, new_min_borrow,
            "min_borrow should be updated"
        );
        assert_eq!(
            config.waiting_period, new_waiting_period,
            "waiting_period should be updated"
        );
        assert_eq!(
            config.public_key, new_public_key,
            "public_key should be updated"
        );
    }

    #[test]
    fn test_execute_update_mod() {
        let mut deps = mock_dependencies();
        instantiate_contract(deps.as_mut());

        // Admin tries to update mod
        let info = mock_info(INIT_ADMIN, &[]); // Using INIT_ADMIN as the admin
        let new_mod = "new_mod_address".to_string();

        // Execute update mod function
        let result = execute_update_mod(deps.as_mut(), info, new_mod.clone());

        // Ensure the execution was successful
        assert!(result.is_ok(), "Execution by admin should be successful");

        // Verify the message sent to the CW20 contract
        let msg = result
            .unwrap()
            .messages
            .get(0)
            .expect("No message found")
            .clone();
        match msg.msg.clone() {
            CosmosMsg::Wasm(WasmMsg::Execute {
                contract_addr, msg, ..
            }) => {
                assert_eq!(
                    contract_addr, "elem_token",
                    "The contract address should be the CW20 token's address."
                );
                let update_minter_msg: Cw20ExecuteMsg =
                    from_json(&msg).expect("Error parsing message.");
                match update_minter_msg {
                    Cw20ExecuteMsg::UpdateMinter { new_minter } => {
                        assert_eq!(
                            new_minter,
                            Some(new_mod),
                            "The new minter address should be updated correctly."
                        );
                    }
                    _ => panic!("Unexpected CW20 message type."),
                }
            }
            _ => panic!("Unexpected message type."),
        }
    }

    #[test]
    fn test_execute_update_mod_not_admin() {
        let mut deps = mock_dependencies();
        instantiate_contract(deps.as_mut());

        // Non-admin tries to update mod
        let info = mock_info("not_admin", &[]); // Using a non-admin address
        let new_mod = "new_mod_address".to_string();

        // Execute update mod function
        let result = execute_update_mod(deps.as_mut(), info, new_mod);

        // Ensure the execution failed
        assert!(result.is_err(), "Execution by non-admin should fail");
    }

    #[test]
    fn test_execute_add_to_treasury_x() {
        let mut deps = mock_dependencies();
        instantiate_contract(deps.as_mut());

        let admin_info = mock_info(INIT_ADMIN, &[]);
        let target = "some_target_address".to_string();
        let amount = Uint128::new(100);

        // Attempt to add to treasury by admin
        let result =
            execute_add_to_treasury_x(deps.as_mut(), admin_info, target.clone(), amount).unwrap();

        // Verify correct CW20 transfer message
        assert_eq!(result.messages.len(), 1, "Expected one message");
        let msg = &result.messages[0];
        if let CosmosMsg::Wasm(WasmMsg::Execute {
            contract_addr, msg, ..
        }) = &msg.msg
        {
            assert_eq!(
                contract_addr,
                &"xnj_token".to_string(),
                "Incorrect token contract address"
            );
            let transfer_msg: Cw20ExecuteMsg = from_json(&msg).unwrap();
            match transfer_msg {
                Cw20ExecuteMsg::Transfer {
                    recipient,
                    amount: msg_amount,
                } => {
                    assert_eq!(recipient, target, "Incorrect transfer recipient");
                    assert_eq!(msg_amount, amount, "Incorrect transfer amount");
                }
                _ => panic!("Unexpected CW20 message type"),
            }
        } else {
            panic!("Unexpected message type");
        }

        // Verify attributes
        assert_eq!(result.attributes[0], ("action", "add_to_treasury_x"));
        assert_eq!(result.attributes[1], ("target", &target));
        assert_eq!(result.attributes[2], ("amount", &amount.to_string()));
    }

    #[test]
    fn test_execute_add_to_treasury_x_not_admin() {
        let mut deps = mock_dependencies();
        instantiate_contract(deps.as_mut());

        let non_admin_info = mock_info("not_admin", &[]);
        let target = "some_target_address".to_string();
        let amount = Uint128::new(100);

        // Attempt to add to treasury by non-admin should fail
        let result = execute_add_to_treasury_x(deps.as_mut(), non_admin_info, target, amount);
        assert!(
            result.is_err(),
            "Non-admin should not be able to add to treasury"
        );
    }

    #[test]
    fn test_execute_add_to_treasury() {
        let mut deps = mock_dependencies();
        instantiate_contract(deps.as_mut());

        let admin_info = mock_info(INIT_ADMIN, &[]);
        let target = "some_other_target_address".to_string();
        let amount = Uint128::new(50);

        // Attempt to add native tokens to treasury by admin
        let result =
            execute_add_to_treasury(deps.as_mut(), admin_info, target.clone(), amount).unwrap();

        // Verify correct Bank send message
        assert_eq!(result.messages.len(), 1, "Expected one message");
        match &result.messages[0].msg {
            CosmosMsg::Bank(BankMsg::Send {
                to_address,
                amount: send_amount,
            }) => {
                assert_eq!(to_address, &target, "Incorrect send to address");
                assert_eq!(send_amount[0].amount, amount, "Incorrect send amount");
            }
            _ => panic!("Unexpected message type"),
        }

        // Verify attributes
        assert_eq!(result.attributes[0], ("action", "add_to_treasury"));
        assert_eq!(result.attributes[1], ("target", &target));
        assert_eq!(result.attributes[2], ("amount", &amount.to_string()));
    }

    #[test]
    fn test_execute_add_to_treasury_not_admin() {
        let mut deps = mock_dependencies();
        instantiate_contract(deps.as_mut());

        let non_admin_info = mock_info("not_the_admin", &[]);
        let target = "some_other_target_address".to_string();
        let amount = Uint128::new(50);

        // Attempt to add native tokens to treasury by non-admin should fail
        let result = execute_add_to_treasury(deps.as_mut(), non_admin_info, target, amount);
        assert!(
            result.is_err(),
            "Non-admin should not be able to add native tokens to treasury"
        );
    }

    #[test]
    fn test_execute_convert_xnj_to_elem_successful() {
        let mut deps = mock_dependencies_with_balance(&[]);
        instantiate_contract(deps.as_mut());

        // Assume this function properly sets up token addresses in the contract state.
        let sender_addr = Addr::unchecked("sender_address");
        let xnj_token_amount = Uint128::new(100);

        let balance = Balance::Cw20(Cw20CoinVerified {
            address: Addr::unchecked("xnj_token"),
            amount: xnj_token_amount,
        });

        // Execute the conversion function.
        let res = execute_convert_xnj_to_elem(deps.as_mut(), mock_env(), balance, sender_addr)
            .expect("Conversion should succeed");

        // Verify that a mint message for ELEM tokens is created.
        assert_eq!(
            res.messages.len(),
            1,
            "Expected one mint message for ELEM tokens"
        );
        let msg = res.messages.first().expect("Expected a CW20 mint message");
        match &msg.msg {
            CosmosMsg::Wasm(WasmMsg::Execute {
                contract_addr, msg, ..
            }) => {
                assert_eq!(
                    contract_addr, "elem_token",
                    "Mint operation targeted at incorrect token address"
                );
                let mint_msg: Cw20ExecuteMsg =
                    from_json(msg).expect("Expected a CW20 mint message");
                if let Cw20ExecuteMsg::Mint { recipient, amount } = mint_msg {
                    assert_eq!(
                        recipient, "sender_address",
                        "Incorrect recipient for minting"
                    );
                    assert_eq!(amount, xnj_token_amount, "Incorrect amount minted");
                } else {
                    panic!("Expected mint message");
                }
            }
            _ => panic!("Expected a CW20 execute message"),
        }
    }

    #[test]
    fn test_execute_convert_elem_to_xnj_successful() {
        let mut deps = mock_dependencies_with_balance(&[]);
        instantiate_contract(deps.as_mut());

        let sender_addr = Addr::unchecked("sender_address");
        let elem_token_amount = Uint128::new(100);

        // Simulate sending ELEM tokens for conversion to XNJ.
        let balance = Balance::Cw20(Cw20CoinVerified {
            address: Addr::unchecked("elem_token"),
            amount: elem_token_amount,
        });

        execute_convert_elem_to_xnj(deps.as_mut(), mock_env(), balance, sender_addr)
            .expect("Conversion should succeed");
    }

    #[test]
    fn test_execute_receive_convert_xnj_to_elem() {
        let mut deps = mock_dependencies();
        instantiate_contract(deps.as_mut());

        let sender = "xnj_token";
        let wrapper_sender = "sender_address";
        let amount = Uint128::new(100);

        let cw20_receive_msg = Cw20ReceiveMsg {
            sender: wrapper_sender.to_string(),
            amount,
            msg: to_json_binary(&ReceiveMsg::ConvertXnjToElem {}).unwrap(),
        };

        let info = mock_info(sender, &[]);

        // Execute the receive function
        let res = execute_receive(deps.as_mut(), mock_env(), info, cw20_receive_msg).unwrap();

        // Verify response: Expect a CW20 mint message for ELEM tokens
        assert_eq!(
            res.messages.len(),
            1,
            "Expected one mint message for ELEM tokens"
        );
        if let CosmosMsg::Wasm(WasmMsg::Execute {
            contract_addr, msg, ..
        }) = &res.messages[0].msg
        {
            assert_eq!(
                contract_addr, "elem_token",
                "Mint operation not targeted at correct CW20 ELEM token"
            );
            let mint_msg: Cw20ExecuteMsg = from_json(&msg).unwrap();
            match mint_msg {
                Cw20ExecuteMsg::Mint {
                    recipient,
                    amount: mint_amount,
                } => {
                    assert_eq!(
                        recipient, wrapper_sender,
                        "Incorrect recipient for ELEM minting"
                    );
                    assert_eq!(mint_amount, amount, "Minted ELEM amount does not match");
                }
                _ => panic!("Expected a mint message for ELEM tokens"),
            }
        } else {
            panic!("Expected a CW20 execute message for ELEM minting");
        }
    }

    #[test]
    fn test_query_total_weight() {
        let mut deps = mock_dependencies();
        let total_weight = 100u64;
        TOTAL.save(deps.as_mut().storage, &total_weight).unwrap();
        let response = query_total_weight(deps.as_ref()).unwrap();
        assert_eq!(response.weight, total_weight);
    }

    #[test]
    fn test_query_staked() {
        let mut deps = mock_dependencies();
        let api = deps.api;
        let addr = "address".to_string();
        let total_inj_staked = Uint128::new(100);
        let total_xnj_received = Uint128::new(200);
        let stake_info = StakeInfo {
            total_inj_staked,
            total_xnj_received,
        };
        STAKE_INFO
            .save(
                deps.as_mut().storage,
                &api.addr_validate(&addr).unwrap(),
                &stake_info,
            )
            .unwrap();

        let cfg = Config {
            denom: Denom::Native("stake".to_string()),
            denom_xnj: Denom::Cw20(Addr::unchecked("xnj_token")),
            denom_elem: Denom::Cw20(Addr::unchecked("elem_token")),
            tokens_per_weight: Uint128::new(10),
            loan_rate: Uint128::new(85),
            min_borrow: Uint128::new(100),
            borrowing_period: true,
            waiting_period: Duration::Height(100),
            public_key: Binary::from(vec![1, 2, 3, 4, 5]),
        };
        CONFIG.save(deps.as_mut().storage, &cfg).unwrap();

        let response = query_staked(deps.as_ref(), addr.clone()).unwrap();

        assert_eq!(response.total_inj_staked, total_inj_staked);
        assert_eq!(response.total_xnj_received, total_xnj_received);
    }

    #[test]
    fn test_execute_burn_token() {
        let mut deps = mock_dependencies_with_balance(&coins(100, "elem_token"));
        default_instantiate(deps.as_mut());

        // Setup: Assume this contract holds ELEM tokens that can be burned.
        // Admin initiates burn token action
        let admin_info = mock_info(INIT_ADMIN, &[]);
        let amount_to_burn = Uint128::new(50);

        // Act: Execute the burn token function as an admin
        let response = execute_burn_token(deps.as_mut(), admin_info, amount_to_burn).unwrap();

        // Assert: Verify that the correct burn message is produced
        assert_eq!(
            response.messages.len(),
            1,
            "Expected one message in response"
        );
        match response.messages.get(0).unwrap().msg.clone() {
            CosmosMsg::Wasm(WasmMsg::Execute {
                contract_addr, msg, ..
            }) => {
                assert_eq!(
                    contract_addr,
                    CW20_ADDRESS.to_string(),
                    "Incorrect contract address in burn message"
                );
                match from_json::<Cw20ExecuteMsg>(&msg).unwrap() {
                    Cw20ExecuteMsg::Burn { amount } => {
                        assert_eq!(
                            amount, amount_to_burn,
                            "Burn amount in message does not match expected value"
                        );
                    }
                    _ => panic!("Unexpected message type. Expected Burn message."),
                }
            }
            _ => panic!("Unexpected message type. Expected WasmMsg::Execute."),
        }

        // Assert: Verify that the attributes are correctly set
        assert_eq!(
            response.attributes.len(),
            3,
            "Expected three attributes in response"
        );
        assert!(
            response
                .attributes
                .iter()
                .any(|attr| attr.key == "action" && attr.value == "burn_elem"),
            "Attribute 'action' missing or incorrect"
        );
        assert!(
            response.attributes.iter().any(
                |attr| attr.key == "amount_to_burn" && attr.value == amount_to_burn.to_string()
            ),
            "Attribute 'amount_to_burn' missing or incorrect"
        );
        assert!(
            response
                .attributes
                .iter()
                .any(|attr| attr.key == "elem_token_contract_addr" && attr.value == CW20_ADDRESS),
            "Attribute 'elem_token_contract_addr' missing or incorrect"
        );
    }
}
