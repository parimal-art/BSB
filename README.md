# Social DApp on Internet Computer

A fully decentralized social media application built on the Internet Computer platform.

## Features

- 🔐 Secure authentication via Internet Identity
- 👤 User profile creation and management
- 📝 Post creation with text and images
- 👍 Like and comment on posts
- 👥 Follow/unfollow other users
- 📱 Responsive UI built with Tailwind CSS

## Tech Stack

- **Backend**: Rust (ic-cdk canister)
- **Frontend**: React.js
- **Styling**: Tailwind CSS
- **Authentication**: Internet Identity

## Getting Started

### Prerequisites

- [DFX](https://internetcomputer.org/docs/current/developer-docs/build/install-upgrade-remove) (Internet Computer SDK)
- Node.js (version 16 or higher)
- npm (version 7 or higher)

### Installation

1. Clone this repository:

```bash
git clone https://github.com/yourusername/social-dapp.git
cd social-dapp
```

2. Install dependencies:

```bash
npm install
```

3. Start the local Internet Computer replica:

```bash
dfx start --background
```

4. Deploy the Internet Identity canister (if not already deployed):

```bash
dfx deploy internet_identity
```

5. Deploy the application:

```bash
./deploy.sh
```

Or manually:

```bash
dfx deploy
```

6. Open the application in your browser:

```
http://localhost:4943/?canisterId=$(dfx canister id BSB_frontend)
```

## Usage

1. **Login**: Use Internet Identity to authenticate
2. **Create Profile**: Set up your profile with name, bio, and photos
3. **Dashboard**: View the latest posts from all users
4. **Create Post**: Share your thoughts and upload images
5. **Interact**: Like, comment, and follow other users

## Development

### Project Structure

- `src/BSB_backend/`: Rust backend canister code
- `src/BSB_frontend/`: React frontend code
- `src/BSB_frontend/components/`: React components

### Local Development

1. Start the local replica:

```bash
dfx start
```

2. In a new terminal, start the development server:

```bash
npm start
```

3. Your app will be available at:

```
http://localhost:3000/
```

### Deploying to the Internet Computer Mainnet

1. Get cycles from the [Cycles Faucet](https://faucet.dfinity.org/)

2. Configure your dfx.json with your principal

3. Deploy to the IC mainnet:

```bash
dfx deploy --network ic
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Internet Computer](https://internetcomputer.org/)
- [DFINITY Foundation](https://dfinity.org/)
- [Tailwind CSS](https://tailwindcss.com/)

# `BSB`

Welcome to your new `BSB` project and to the Internet Computer development community. By default, creating a new project adds this README and some template files to your project directory. You can edit these template files to customize your project and to include your own code to speed up the development cycle.

To get started, you might want to explore the project directory structure and the default configuration file. Working with this project in your development environment will not affect any production deployment or identity tokens.

To learn more before you start working with `BSB`, see the following documentation available online:

- [Quick Start](https://internetcomputer.org/docs/current/developer-docs/setup/deploy-locally)
- [SDK Developer Tools](https://internetcomputer.org/docs/current/developer-docs/setup/install)
- [Rust Canister Development Guide](https://internetcomputer.org/docs/current/developer-docs/backend/rust/)
- [ic-cdk](https://docs.rs/ic-cdk)
- [ic-cdk-macros](https://docs.rs/ic-cdk-macros)
- [Candid Introduction](https://internetcomputer.org/docs/current/developer-docs/backend/candid/)

If you want to start working on your project right away, you might want to try the following commands:

```bash
cd BSB/
dfx help
dfx canister --help
```

## Running the project locally

If you want to test your project locally, you can use the following commands:

```bash
# Starts the replica, running in the background
dfx start --background

# Deploys your canisters to the replica and generates your candid interface
dfx deploy
```

Once the job completes, your application will be available at `http://localhost:4943?canisterId={asset_canister_id}`.

If you have made changes to your backend canister, you can generate a new candid interface with

```bash
npm run generate
```

at any time. This is recommended before starting the frontend development server, and will be run automatically any time you run `dfx deploy`.

If you are making frontend changes, you can start a development server with

```bash
npm start
```

Which will start a server at `http://localhost:8080`, proxying API requests to the replica at port 4943.

### Note on frontend environment variables

If you are hosting frontend code somewhere without using DFX, you may need to make one of the following adjustments to ensure your project does not fetch the root key in production:

- set`DFX_NETWORK` to `ic` if you are using Webpack
- use your own preferred method to replace `process.env.DFX_NETWORK` in the autogenerated declarations
  - Setting `canisters -> {asset_canister_id} -> declarations -> env_override to a string` in `dfx.json` will replace `process.env.DFX_NETWORK` with the string in the autogenerated declarations
- Write your own `createActor` constructor
