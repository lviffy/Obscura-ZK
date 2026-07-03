#!/bin/bash
set -euo pipefail

# ==============================================================================
# Stellar-ZK Credential Only Contract Deployment Script
# Deploys: zk_credential to Testnet and updates frontend env
# Usage:  bash scripts/deploy_zk_credential.sh
# ==============================================================================

STELLAR="/home/lviffy/.local/bin/stellar"
NETWORK="testnet"
WASM_DIR="target/wasm32v1-none/release"
FRONTEND_ENV="frontend/.env.local"
CONTRACTS_TS="frontend/src/lib/contracts.ts"

# Load environment variables from .env file
if [ -f ".env" ]; then
    echo "▸ Loading environment variables from .env..."
    export $(grep -v '^#' .env | xargs)
fi

DEPLOYER_SECRET="${DEPLOYER_SECRET:-}"
if [ -z "$DEPLOYER_SECRET" ]; then
    echo "ERROR: DEPLOYER_SECRET is not set. Please set it in your environment or a .env file."
    exit 1
fi
DEPLOYER_ALIAS="stellar-zk-deployer"

echo ""
echo "============================================================"
echo "         ZK Credential Testnet Deployment Only"
echo "============================================================"
echo ""

echo "[1] Registering deployer key as '$DEPLOYER_ALIAS'..."
echo "$DEPLOYER_SECRET" | "$STELLAR" keys add "$DEPLOYER_ALIAS" --secret-key --overwrite 2>&1 || true

DEPLOYER_PUBKEY=$("$STELLAR" keys address "$DEPLOYER_ALIAS" 2>&1)
echo "    Public key : $DEPLOYER_PUBKEY"

# Check account funded on testnet
echo ""
echo "[2] Checking account balance on testnet..."
ACCOUNT_JSON=$(curl -sf "https://horizon-testnet.stellar.org/accounts/$DEPLOYER_PUBKEY" 2>/dev/null || echo "NOT_FOUND")
if echo "$ACCOUNT_JSON" | grep -q "NOT_FOUND\|Resource Missing\|type.*problem"; then
    echo "    Account not found — funding via Friendbot..."
    curl -sf "https://friendbot.stellar.org/?addr=$DEPLOYER_PUBKEY" > /dev/null
    echo "    Funded with testnet XLM!"
else
    echo "    Account is active."
fi

# Build WASM contract
echo ""
echo "[3] Building ZK Credential contract (release + wasm32v1-none)..."
cargo build \
    --package zk_credential \
    --target wasm32v1-none \
    --release 2>&1

WASM_PATH="$WASM_DIR/zk_credential.wasm"
if [ ! -f "$WASM_PATH" ]; then
    echo "ERROR: $WASM_PATH not found after build"
    exit 1
fi
echo "    OK: zk_credential.wasm ($(wc -c < "$WASM_PATH") bytes)"

# Generate valid UltraHonk VK placeholder (1760 bytes)
echo ""
echo "[4] Generating valid UltraHonk VK placeholder (1760 bytes)..."
VK_HEADER="0000000000000008000000000000000300000000000000100000000000000001"
VK_POINTS=$(python3 -c "print('00' * 27 * 64)")
DUMMY_VK_HEX="${VK_HEADER}${VK_POINTS}"

VK_BYTE_LEN=$(( ${#DUMMY_VK_HEX} / 2 ))
echo "    VK hex length: $VK_BYTE_LEN bytes (expected 1760)"
if [ "$VK_BYTE_LEN" -ne 1760 ]; then
    echo "ERROR: VK length mismatch!"
    exit 1
fi

# Deploy zk_credential
echo ""
echo "[5] Deploying zk_credential..."
ZK_CRED_RAW=$("$STELLAR" contract deploy \
    --wasm "$WASM_DIR/zk_credential.wasm" \
    --source "$DEPLOYER_ALIAS" \
    --network "$NETWORK" \
    -- \
    --vk_bytes "$DUMMY_VK_HEX" 2>&1)
echo "$ZK_CRED_RAW"
ZK_CRED_ID=$(echo "$ZK_CRED_RAW" | grep -oE 'C[A-Z0-9]{55}' | tail -1)

if [ -z "$ZK_CRED_ID" ]; then
    echo "ERROR: Could not extract zk_credential contract address"
    exit 1
fi
echo "    New zk_credential address: $ZK_CRED_ID"

# Update frontend configs in place
echo ""
echo "[6] Updating frontend config files in place..."
if [ -f "$CONTRACTS_TS" ]; then
    sed -i "s/export const ZK_CREDENTIAL_ID =.*/export const ZK_CREDENTIAL_ID = process.env.NEXT_PUBLIC_ZK_CREDENTIAL_ID || \"$ZK_CRED_ID\";/g" "$CONTRACTS_TS"
    echo "    Updated : $CONTRACTS_TS"
else
    echo "    WARNING: $CONTRACTS_TS not found"
fi

if [ -f "$FRONTEND_ENV" ]; then
    sed -i "s/NEXT_PUBLIC_ZK_CREDENTIAL_ID=.*/NEXT_PUBLIC_ZK_CREDENTIAL_ID=$ZK_CRED_ID/g" "$FRONTEND_ENV"
    echo "    Updated : $FRONTEND_ENV"
else
    echo "    WARNING: $FRONTEND_ENV not found"
fi

echo ""
echo "============================================================"
echo "         ZK CREDENTIAL DEPLOYMENT COMPLETE"
echo "============================================================"
echo "  zk_credential: $ZK_CRED_ID"
echo "  Explorer: https://stellar.expert/explorer/testnet/contract/$ZK_CRED_ID"
echo "============================================================"
echo ""
