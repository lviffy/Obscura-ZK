#!/bin/bash
set -euo pipefail

# ==============================================================================
# Stellar-ZK Contract Deployment Script
# Deploys: zk_credential, private_governance, private_treasury to Testnet
# Usage:  bash scripts/deploy.sh
# ==============================================================================

STELLAR="/home/lviffy/.local/bin/stellar"
NETWORK="testnet"
WASM_DIR="target/wasm32v1-none/release"
FRONTEND_ENV="frontend/.env.local"
CONTRACTS_TS="frontend/src/lib/contracts.ts"

# ---------------------------------------------------------------------------
# Load environment variables from .env file if it exists
# ---------------------------------------------------------------------------
if [ -f ".env" ]; then
    echo "▸ Loading environment variables from .env..."
    # Export vars, ignoring comments
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
echo "         Stellar-ZK Testnet Deployment"
echo "============================================================"
echo ""

echo "[1] Registering deployer key as '$DEPLOYER_ALIAS'..."
echo "$DEPLOYER_SECRET" | "$STELLAR" keys add "$DEPLOYER_ALIAS" --secret-key --overwrite 2>&1 || true

DEPLOYER_PUBKEY=$("$STELLAR" keys address "$DEPLOYER_ALIAS" 2>&1)
echo "    Public key : $DEPLOYER_PUBKEY"

# ---------------------------------------------------------------------------
# Check account funded on testnet
# ---------------------------------------------------------------------------
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

# ---------------------------------------------------------------------------
# Build WASM contracts
# ---------------------------------------------------------------------------
echo ""
echo "[3] Building Soroban contracts (release + wasm32v1-none)..."
cargo build \
    --package zk_credential \
    --package private_governance \
    --package private_treasury \
    --target wasm32v1-none \
    --release 2>&1

# Build RISC Zero mock verifier contract
cargo build \
    --manifest-path lib/stellar-risc0-verifier/Cargo.toml \
    --package mock-verifier \
    --target wasm32v1-none \
    --release 2>&1

# Copy mock verifier WASM to target/wasm32v1-none/release
cp lib/stellar-risc0-verifier/target/wasm32v1-none/release/mock_verifier.wasm "$WASM_DIR/mock_verifier.wasm"

for wasm in zk_credential private_governance private_treasury mock_verifier; do
    WASM_PATH="$WASM_DIR/${wasm}.wasm"
    if [ ! -f "$WASM_PATH" ]; then
        echo "ERROR: $WASM_PATH not found after build"
        exit 1
    fi
    echo "    OK: ${wasm}.wasm ($(wc -c < "$WASM_PATH") bytes)"
done

# ---------------------------------------------------------------------------
# Build a structurally valid 1760-byte UltraHonk VK placeholder.
#
# Layout (from ultrahonk-soroban-verifier/src/utils.rs):
#   4 x u64 big-endian header  (32 bytes)
#   27 x 64-byte G1 points     (1728 bytes)
#   Total = 1760 bytes
#
# Validation rules (load_vk_from_bytes):
#   log_circuit_size ∈ [1, 28]
#   circuit_size == 2 ^ log_circuit_size
#   public_inputs_size >= 16  (PAIRING_POINTS_SIZE)
#   pub_inputs_offset <= circuit_size
# ---------------------------------------------------------------------------
echo ""
echo "[4] Generating valid UltraHonk VK placeholder (1760 bytes)..."

# Header: circuit_size=8, log_circuit_size=3, public_inputs_size=16, pub_inputs_offset=1
VK_HEADER="0000000000000008000000000000000300000000000000100000000000000001"
# 27 G1 points, all zeros (point at infinity is valid on BN254)
VK_POINTS=$(python3 -c "print('00' * 27 * 64)")
DUMMY_VK_HEX="${VK_HEADER}${VK_POINTS}"

VK_BYTE_LEN=$(( ${#DUMMY_VK_HEX} / 2 ))
echo "    VK hex length: $VK_BYTE_LEN bytes (expected 1760)"
if [ "$VK_BYTE_LEN" -ne 1760 ]; then
    echo "ERROR: VK length mismatch!"
    exit 1
fi

# ---------------------------------------------------------------------------
# STEP A: Deploy zk_credential  (constructor takes vk_bytes)
# ---------------------------------------------------------------------------
echo ""
echo "[5] Deploying zk_credential..."
ZK_CRED_RAW=$("$STELLAR" contract deploy \
    --wasm "$WASM_DIR/zk_credential.wasm" \
    --source "$DEPLOYER_ALIAS" \
    --network "$NETWORK" \
    -- \
    --vk_bytes "$DUMMY_VK_HEX" 2>&1)
echo "$ZK_CRED_RAW"
# Extract the contract address (last non-empty line, 56 chars, starts with C)
ZK_CRED_ID=$(echo "$ZK_CRED_RAW" | grep -oE 'C[A-Z0-9]{55}' | tail -1)

if [ -z "$ZK_CRED_ID" ]; then
    echo "ERROR: Could not extract zk_credential contract address"
    exit 1
fi
echo "    zk_credential    : $ZK_CRED_ID"

# ---------------------------------------------------------------------------
# STEP A2: Deploy mock_verifier
# ---------------------------------------------------------------------------
echo ""
echo "[5b] Deploying mock_verifier..."
MOCK_VERIFIER_RAW=$("$STELLAR" contract deploy \
    --wasm "$WASM_DIR/mock_verifier.wasm" \
    --source "$DEPLOYER_ALIAS" \
    --network "$NETWORK" \
    -- \
    --selector "cccccccc" 2>&1)
echo "$MOCK_VERIFIER_RAW"
MOCK_VERIFIER_ID=$(echo "$MOCK_VERIFIER_RAW" | grep -oE 'C[A-Z0-9]{55}' | tail -1)

if [ -z "$MOCK_VERIFIER_ID" ]; then
    echo "ERROR: Could not extract mock_verifier contract address"
    exit 1
fi
echo "    mock_verifier    : $MOCK_VERIFIER_ID"

# ---------------------------------------------------------------------------
# STEP B: Deploy private_governance + initialize
# ---------------------------------------------------------------------------
echo ""
echo "[6] Deploying private_governance..."
GOV_RAW=$("$STELLAR" contract deploy \
    --wasm "$WASM_DIR/private_governance.wasm" \
    --source "$DEPLOYER_ALIAS" \
    --network "$NETWORK" 2>&1)
echo "$GOV_RAW"
GOV_ID=$(echo "$GOV_RAW" | grep -oE 'C[A-Z0-9]{55}' | tail -1)

if [ -z "$GOV_ID" ]; then
    echo "ERROR: Could not extract private_governance contract address"
    exit 1
fi
echo "    private_governance: $GOV_ID"

echo "    Initializing private_governance..."
"$STELLAR" contract invoke \
    --id "$GOV_ID" \
    --source "$DEPLOYER_ALIAS" \
    --network "$NETWORK" \
    -- initialize \
    --zk_credential "$ZK_CRED_ID" \
    --vk '{
        "alpha": "2f12bff82c239730516073049236cf88bca68db1230a61418d2a9657041b032c09f2b7e4f3ef1374f7fac49f8655a91c79df0b311faa355082f593be082d8b33",
        "beta":  "2504b8a9cd6f90074b783cfb68186ed28a358ac4f92c2ced9b0e34e047cc4ee818d1894e03e1f07e1af6d893857c2c0fa34bbd4741959b4b815c432c9e8e6cef0a75dfeec8d1b585054013ec81c790d004ff1e744a254c10f39b16f34f025de5269d168bd0c00ba7eae7be5ca9e1fd8d545ed2df4f7f49aec72429ac60723b9a",
        "gamma": "198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c21800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa",
        "delta": "26b45103b6ac900a07273867858edab29a26a08131249d4a7b72b81009452df5182619fa49445884f38dc832b974c41db5ce80ae105fc73376d64d08d305598b116dedb40d11afed5044352ea81d3715fa2db561b8ccfc45419431c53044f6fb2c795365a5c7c832850e40aad8df41be187d207728513bb23126ee1c8103b0e1",
        "ic": [
            "155ff856f2bdcf3803d2434805ee23ee329f3fe4ecbfe696ae9f3e4794ac20ea0546a537c452725b8e55a9f9eb659f21964e7f1e6476a40a87534b17976597ef",
            "16d03bb47c003c40a9980e2c341f2f68296212b45b42ce16143e7be6fdba6a6e1bf6cebdfbebe4e074e121e7fd3235882ef64e3c6443a09392d6d34c1bcb5eb3",
            "2432400451c604aa4d0f21e45a6056e7d6a4ad6a43775889a2ef8497eb2190490ab7ce50ed87be9fda862fb13215e578243f661357efb54a70d35e6caebd14ef",
            "1f9832a3c58950b93f48370d2213f674a307ff75a501a0ac03da676e0fc53dba18762e0e0808289bd763742b5520415602fe4bc64a5c3abc0dfffcfaf66b11fd",
            "03c3408a21346a46245e3e079e7dd9ab843a74222ca7b482624e211f4f6369242ef840ae3e7f2fa856867f40e5a40ffe194761d8020f08665b076b637c98df37"
        ]
    }' 2>&1
echo "    initialized."

# ---------------------------------------------------------------------------
# STEP C: Deploy private_treasury + initialize
# ---------------------------------------------------------------------------
echo ""
echo "[7] Deploying private_treasury..."
TREASURY_RAW=$("$STELLAR" contract deploy \
    --wasm "$WASM_DIR/private_treasury.wasm" \
    --source "$DEPLOYER_ALIAS" \
    --network "$NETWORK" 2>&1)
echo "$TREASURY_RAW"
TREASURY_ID=$(echo "$TREASURY_RAW" | grep -oE 'C[A-Z0-9]{55}' | tail -1)

if [ -z "$TREASURY_ID" ]; then
    echo "ERROR: Could not extract private_treasury contract address"
    exit 1
fi
echo "    private_treasury  : $TREASURY_ID"

# Native XLM SAC address on Testnet
NATIVE_XLM_SAC="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
DUMMY_IMAGE_ID="0000000000000000000000000000000000000000000000000000000000000000"

echo "    Initializing private_treasury..."
"$STELLAR" contract invoke \
    --id "$TREASURY_ID" \
    --source "$DEPLOYER_ALIAS" \
    --network "$NETWORK" \
    -- initialize \
    --token "$NATIVE_XLM_SAC" \
    --zk_credential "$ZK_CRED_ID" \
    --risc0_verifier "$MOCK_VERIFIER_ID" \
    --risc0_image_id "$DUMMY_IMAGE_ID" \
    --noir_vk "$DUMMY_VK_HEX" 2>&1
echo "    initialized."

# ---------------------------------------------------------------------------
# Update frontend config
# ---------------------------------------------------------------------------
echo ""
echo "[8] Writing frontend configuration..."

cat > "$CONTRACTS_TS" << TSEOF
// Auto-generated by scripts/deploy.sh on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
// Network: Testnet  |  Deployer: $DEPLOYER_PUBKEY
export const ZK_CREDENTIAL_ID = process.env.NEXT_PUBLIC_ZK_CREDENTIAL_ID || "$ZK_CRED_ID";
export const PRIVATE_GOVERNANCE_ID = process.env.NEXT_PUBLIC_PRIVATE_GOVERNANCE_ID || "$GOV_ID";
export const PRIVATE_TREASURY_ID = process.env.NEXT_PUBLIC_PRIVATE_TREASURY_ID || "$TREASURY_ID";

export const STELLAR_NETWORK = "TESTNET";
export const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";
TSEOF

cat > "$FRONTEND_ENV" << ENVEOF
# Auto-generated by scripts/deploy.sh on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
NEXT_PUBLIC_ZK_CREDENTIAL_ID=$ZK_CRED_ID
NEXT_PUBLIC_PRIVATE_GOVERNANCE_ID=$GOV_ID
NEXT_PUBLIC_PRIVATE_TREASURY_ID=$TREASURY_ID
NEXT_PUBLIC_STELLAR_NETWORK=TESTNET
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
ENVEOF

echo "    Updated : $CONTRACTS_TS"
echo "    Created : $FRONTEND_ENV"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "============================================================"
echo "            DEPLOYMENT COMPLETE"
echo "============================================================"
echo "  zk_credential      : $ZK_CRED_ID"
echo "  private_governance : $GOV_ID"
echo "  private_treasury   : $TREASURY_ID"
echo ""
echo "  Explorer: https://stellar.expert/explorer/testnet/contract/$ZK_CRED_ID"
echo "============================================================"
echo ""
