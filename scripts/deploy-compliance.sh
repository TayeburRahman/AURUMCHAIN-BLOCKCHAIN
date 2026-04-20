#!/bin/bash

# AURUMCHAIN - Compliance Program Deployment Script
# Targets: Solana Devnet

echo "--------------------------------------------------"
echo "AURUMCHAIN - DEPLOYING COMPLIANCE PROGRAM"
echo "--------------------------------------------------"

# 1. Build
echo "[1/4] Building program..."
anchor build -p compliance_transfer

# 2. Deploy
echo "[2/4] Deploying to Devnet..."
anchor deploy --provider.cluster devnet -p compliance_transfer

# 3. IDL Sync
echo "[3/4] Syncing IDL to source..."
cp target/idl/compliance_transfer.json programs/compliance_transfer/src/idl.json

# 4. Update IDL in Web3 lib
echo "[4/4] Syncing IDL to web3 library..."
mkdir -p lib/web3/idl
cp target/idl/compliance_transfer.json lib/web3/idl/compliance_transfer.json

echo "--------------------------------------------------"
echo "✓ Compliance Program Deployed Successfully!"
echo "--------------------------------------------------"
