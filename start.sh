#!/bin/bash

echo "🚀 Starting the Social DApp..."

# Check if DFX is running
if ! dfx ping > /dev/null 2>&1; then
  echo "🔄 Starting local Internet Computer replica..."
  dfx start --clean --background
  sleep 5
fi

# Get canister IDs
FRONTEND_ID=$(dfx canister id BSB_frontend)
II_CANISTER_ID=$(dfx canister id internet_identity)
BACKEND_ID=$(dfx canister id BSB_backend)

# Ensure all canisters are running
echo "✅ Ensuring all canisters are running..."
dfx canister start --all

echo ""
echo "🌐 Your Social DApp is now available at:"
echo "   http://$FRONTEND_ID.localhost:4943/"
echo ""
echo "🔑 Internet Identity authentication is available at:"
echo "   http://$II_CANISTER_ID.localhost:4943/"
echo ""
echo "📝 Backend Candid interface (for developers):"
echo "   http://127.0.0.1:4943/?canisterId=$BACKEND_ID&id=$BACKEND_ID"
echo ""
echo "✨ Happy socializing on the Internet Computer! ✨" 