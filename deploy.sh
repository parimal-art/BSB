#!/bin/bash

echo "🚀 Starting deployment of Social DApp..."

# Make sure DFX is running
echo "🔍 Checking if DFX is running..."
dfx ping || { echo "⚠️ DFX is not running. Starting DFX..."; dfx start --clean --background; sleep 5; }

# First clean the Internet Identity canister to ensure proper installation
echo "🧹 Cleaning Internet Identity canister..."
dfx canister stop internet_identity || true
dfx canister delete internet_identity || true

# Download the Internet Identity WASM and DID files directly
echo "📥 Downloading Internet Identity WASM and DID files..."
II_RELEASE="release-2023-11-17"
II_WASM_URL="https://github.com/dfinity/internet-identity/releases/download/$II_RELEASE/internet_identity_dev.wasm.gz"
II_DID_URL="https://github.com/dfinity/internet-identity/releases/download/$II_RELEASE/internet_identity.did"

curl -sSL "$II_WASM_URL" -o internet_identity_dev.wasm.gz
curl -sSL "$II_DID_URL" -o internet_identity.did

echo "📦 Installing Internet Identity..."
gunzip -f internet_identity_dev.wasm.gz
dfx canister create internet_identity
dfx canister install internet_identity --wasm internet_identity_dev.wasm --mode=reinstall

# Save the Internet Identity canister ID
II_CANISTER_ID=$(dfx canister id internet_identity)
echo "🔑 Internet Identity canister ID: $II_CANISTER_ID"

# Cleanup
echo "🧹 Cleaning up temporary files..."
rm -f internet_identity_dev.wasm internet_identity.did

# Generate Candid interface for the backend
echo "📝 Generating Candid interface..."
dfx generate BSB_backend

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install

# Build the frontend
echo "🔨 Building frontend..."
cd src/BSB_frontend && npm run build && cd ../../

# Deploy the application canisters
echo "🛠️ Deploying application canisters..."
dfx deploy BSB_backend
dfx deploy BSB_frontend

# Ensure all canisters are running
echo "✅ Starting all canisters..."
dfx canister start --all

echo "✅ Deployment complete!"
echo "🌐 Your Social DApp is now available at:"
echo "   http://localhost:4943/?canisterId=$(dfx canister id BSB_frontend)"
echo ""
echo "🔑 Internet Identity is available at:"
echo "   http://localhost:4943/?canisterId=$II_CANISTER_ID"
echo ""
echo "🌟 To access the app directly with II authentication, use:"
echo "   http://$(dfx canister id BSB_frontend).localhost:4943" 