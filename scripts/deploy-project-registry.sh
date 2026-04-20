#!/bin/bash

# AURUMCHAIN - Project Registry Deployment Script
# Targets: Solana Devnet

echo "--------------------------------------------------"
echo "AURUMCHAIN - DEPLOYING PROJECT REGISTRY"
echo "--------------------------------------------------"

# 1. Build
echo "[1/4] Building program..."
anchor build -p project_registry

# 2. Deploy
echo "[2/4] Deploying to Devnet..."
anchor deploy --provider.cluster devnet -p project_registry

# 3. IDL Sync
echo "[3/4] Syncing IDL to source..."
cp target/idl/project_registry.json programs/project_registry/src/idl.json

# 4. Update IDL in Web3 lib
echo "[4/4] Syncing IDL to web3 library..."
mkdir -p lib/web3/idl
cp target/idl/project_registry.json lib/web3/idl/project_registry.json

echo "--------------------------------------------------"
echo "✓ Project Registry Deployed Successfully!"
echo "--------------------------------------------------"
