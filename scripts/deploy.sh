#!/bin/bash
set -e

# ==============================================================================
# Stellar Shield Contract Deployment & Initialization Script
# ==============================================================================

NETWORK="testnet"
RPC_URL="https://soroban-testnet.stellar.org"
FRIENDBOT_URL="https://friendbot.stellar.org"

echo "=== Stellar Shield Deployer ==="

# 1. Ensure keys are available
if [ -z "$STELLAR_ACCOUNT_SECRET" ]; then
    echo "Creating a temporary deployer key pair..."
    # Generate temporary key pair
    KEYS=$(stellar keys generate deployer --network "$NETWORK" --global 2>/dev/null || echo "failed")
    if [ "$KEYS" = "failed" ]; then
        echo "Stellar CLI not found or failed to generate keys."
        echo "Please set STELLAR_ACCOUNT_SECRET or run this on a machine with stellar-cli installed."
        exit 1
    fi
    STELLAR_ACCOUNT_SECRET="deployer"
else
    echo "Using provided deployer key."
fi

# 2. Build WASM smart contracts using the wasm32v1-none target
echo "Building Soroban contracts..."
cargo build --package zk_credential --package private_governance --package private_treasury --target wasm32v1-none --release

WASM_DIR="target/wasm32v1-none/release"

# 3. Deploy zk_credential
echo "Deploying zk_credential.wasm..."
# Construct initial dummy VK bytes for Noir credential circuit
DUMMY_VK="0x$(printf '00%.0s' {1..64})" # placeholder vk

ZK_CRED_ID=$(stellar contract deploy \
    --wasm "$WASM_DIR/zk_credential.wasm" \
    --source "$STELLAR_ACCOUNT_SECRET" \
    --network "$NETWORK" \
    -- \
    --vk_bytes "$DUMMY_VK")

echo "zk_credential Deployed: $ZK_CRED_ID"

# 4. Deploy private_governance
echo "Deploying private_governance.wasm..."
# We will use the Circom voting verification key parameters from test.rs
# To simplify invocation, we can construct the arguments JSON or parse parameters.
# In a shell script, we can initialize using `stellar contract invoke` or at constructor.
# Here we deploy first, then invoke initialize.
GOV_ID=$(stellar contract deploy \
    --wasm "$WASM_DIR/private_governance.wasm" \
    --source "$STELLAR_ACCOUNT_SECRET" \
    --network "$NETWORK")

echo "private_governance Deployed: $GOV_ID"

# Initialize private_governance
# In this mockup, we pass the zk_credential contract address and dummy vk points
echo "Initializing private_governance..."
stellar contract invoke \
    --id "$GOV_ID" \
    --source "$STELLAR_ACCOUNT_SECRET" \
    --network "$NETWORK" \
    -- \
    initialize \
    --zk_credential "$ZK_CRED_ID" \
    --vk '{
        "alpha": {"x": "0000000000000000000000000000000000000000000000000000000000000000", "y": "0000000000000000000000000000000000000000000000000000000000000000"},
        "beta": {"x": ["0000000000000000000000000000000000000000000000000000000000000000", "0000000000000000000000000000000000000000000000000000000000000000"], "y": ["0000000000000000000000000000000000000000000000000000000000000000", "0000000000000000000000000000000000000000000000000000000000000000"]},
        "gamma": {"x": ["0000000000000000000000000000000000000000000000000000000000000000", "0000000000000000000000000000000000000000000000000000000000000000"], "y": ["0000000000000000000000000000000000000000000000000000000000000000", "0000000000000000000000000000000000000000000000000000000000000000"]},
        "delta": {"x": ["0000000000000000000000000000000000000000000000000000000000000000", "0000000000000000000000000000000000000000000000000000000000000000"], "y": ["0000000000000000000000000000000000000000000000000000000000000000", "0000000000000000000000000000000000000000000000000000000000000000"]},
        "ic": []
    }'

# 5. Deploy private_treasury
echo "Deploying private_treasury.wasm..."
TREASURY_ID=$(stellar contract deploy \
    --wasm "$WASM_DIR/private_treasury.wasm" \
    --source "$STELLAR_ACCOUNT_SECRET" \
    --network "$NETWORK")

echo "private_treasury Deployed: $TREASURY_ID"

# Setup default/test assets on testnet
# We deploy a custom SAC (Stellar Asset Contract) token or use native XLM (CDLZEA...)
# Here we use a dummy contract address for the token and verifiers to showcase setup
MOCK_TOKEN="CDLZEA23JFKM2GDH6FBOWBOSY52WJKNYX6LWLNRE66SOTVJ524FWAOPO"
MOCK_R0_VERIFIER="CDT2EA23JFKM2GDH6FBOWBOSY52WJKNYX6LWLNRE66SOTVJ524FWAOPO"
DUMMY_IMAGE_ID="0000000000000000000000000000000000000000000000000000000000000000"

echo "Initializing private_treasury..."
stellar contract invoke \
    --id "$TREASURY_ID" \
    --source "$STELLAR_ACCOUNT_SECRET" \
    --network "$NETWORK" \
    -- \
    initialize \
    --token "$MOCK_TOKEN" \
    --zk_credential "$ZK_CRED_ID" \
    --risc0_verifier "$MOCK_R0_VERIFIER" \
    --risc0_image_id "$DUMMY_IMAGE_ID" \
    --noir_vk "$DUMMY_VK"

echo "=== Deployment Completed Successfully ==="
echo "Copy-paste these configuration values into frontend/src/lib/contracts.ts:"
echo "--------------------------------------------------"
echo "export const ZK_CREDENTIAL_ID = \"$ZK_CRED_ID\";"
echo "export const PRIVATE_GOVERNANCE_ID = \"$GOV_ID\";"
echo "export const PRIVATE_TREASURY_ID = \"$TREASURY_ID\";"
echo "--------------------------------------------------"
