# xNinja Controller Smart Contract

This smart contract facilitates controller on xNinja.Tech.

Build: `cargo build`

Test: `cargo test`

## Messages

`Borrow {inj_price_usd, nonce, timestamp, signature}`

Attributes emitted:

| Key        | Value      |
| ---------- | ---------- |
| "action"   | "borrow"   |
| "recipient"| sender     |
| "amount"   | amount     |

`Repay, ConvertXnjToElem, ConvertElemToXnj` is CW-20 Receive msg, client trigger Send with msg: Repay, ConvertXnjToElem, ConvertElemToXnj. `Repay{nonce, timestamp, signature}`

`BurnToken{amount}` - Remove `amount` tokens from the balance.

Attributes emitted:

| Key      | Value  |
| -------- | ------ |
| "action" | "burn" |
| "from"   | sender |
| "amount" | amount |

`UpdateAdmin{admin}` - changes (or clears) the admin for the contract

Attributes emitted:

| Key       | Value                    |
| --------- | ------------------------ |
| "action"  | "update_members"         |
| "sender"  | msg sender               |
| "added"   | count of added members   |
| "removed" | count of removed members |

`AddHook{addr}` - adds a contract address to be called upon every `UpdateMembers` call. This can only be called by the
admin, and care must be taken. A contract returning an error or running out of gas will revert the membership change
(see more in Hooks section below).

Attributes emitted:

| Key      | Value        |
| -------- | ------------ |
| "action" | "add_hook"   |
| "sender" | msg sender   |
| "hook"   | hook address |

`RemoveHook{addr}` - unregister a contract address that was previously set by `AddHook`.

Attributes emitted:

| Key      | Value         |
| -------- | ------------- |
| "action" | "remove_hook" |
| "sender" | msg sender    |
| "hook"   | hook address  |

## Queries

`Admin{}` - Returns the `admin` address, or `None` if unset.

`Staked{ address }` - Returns the history borrow.

`Claims{ address }` - Returns the claim available when convert tokens.
