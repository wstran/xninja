use cosmwasm_std::StdError;
use thiserror::Error;

use cw_controllers::{AdminError, HookError};

#[derive(Error, Debug, PartialEq)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("{0}")]
    Admin(#[from] AdminError),

    #[error("{0}")]
    Hook(#[from] HookError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Borrowing is currently disabled")]
    BorrowingDisabled,

    #[error("No claims that can be released currently")]
    NothingToClaim {},

    #[error("Must send '{0}'")]
    MissingDenom(String),

    #[error("Sent unsupported denoms, must send '{0}'")]
    ExtraDenoms(String),

    #[error("Must send valid address to")]
    InvalidDenom(String),

    #[error("Missed address or denom")]
    MixedNativeAndCw20(String),

    #[error("No funds sent")]
    NoFunds {},
    #[error("No data in ReceiveMsg")]
    NoData {},

    #[error("Insufficient funds for repayment")]
    InsufficientFunds {},

    #[error("Insufficient XNJ received for the operation")]
    InsufficientXNJ {},

    #[error("Invalid funds provided: {0}")]
    InvalidFunds(String),

    #[error("Action not supported")]
    ActionNotSupported,

    #[error("Invalid operation: {0}")]
    InvalidOperation(String),

    #[error("Invalid recipient address")]
    InvalidRecipient {},

    #[error("Signature verification failed")]
    InvalidSignature,

    #[error("Reset failed")]
    ResetFailed(String),
}
