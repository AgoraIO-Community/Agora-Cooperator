# Agora Cooperator

![build workflow](https://github.com/AgoraIO-Community/Agora-Cooperator/actions/workflows/ci-api.yml/badge.svg) ![build workflow](https://github.com/AgoraIO-Community/Agora-Cooperator/actions/workflows/ci-ui.yml/badge.svg)

> if you want to try this samples directly, please download samples from [here](https://github.com/AgoraIO-Community/agora-remote-desktop-control-samples/releases)

### Prerequisites

1. Please make sure [Node.js 14+](https://nodejs.org/) has been installed.

#### Clone our samples:

```
$ git clone https://github.com/AgoraIO-Community/Agora-Cooperator.git
```

### Quick Start

1. enable corepack

   ```sh
   $ corepack enable
   ```

2. activate pnpm

   ```sh
   $ corepack prepare pnpm@latest --activate
   ```

3. install dependencies
   ```sh
   $ pnpm install --shamefully-hoist
   ```
4. if you don't want to run a local server, you can modify `API_HOST` in the `packages/assembly-ui/config-overrides.js` file to use a remote server.

5. run client
   ```sh
   $ pnpm start --filter=assembly-shared --filter=assembly-ui --parallel
   ```
