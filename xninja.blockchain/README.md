# xNinja.Tech Injective Contracts

## Setup

```bash
# Add the wasm32 architecture target
rustup target add wasm32-unknown-unknown

# Install the CosmWasm contract verification utility
cargo install cosmwasm-check
```

```bash
# format:
cargo fmt --all -- --check
cargo fmt

# check:
cargo clippy

# test:
cargo test

# coverage
cargo install cargo-tarpaulin
cargo tarpaulin -o html 
open tarpaulin-report.html

# cargo tarpaulin -o html --packages cw-

# optimize 
./script/optimizer.sh
```

## Contracts

| Name                                      | Description                                                |
| ----------------------------------------- | -----------------------------------------------------------|
| [`cw-controller`](contracts/cw-controller)| Facilitates controller in xNinja                           |

## Checksum

