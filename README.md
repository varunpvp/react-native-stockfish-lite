# Native Stockfish Lite

Private maintained copy of [ReactNativeStockfish](https://github.com/loloof64/ReactNativeStockfish),
using the compact Stockfish.js v19.0.1 engine and its embedded 1.1 MB network.
The engine runs natively. No WebView, WASM runtime, or network download is needed.

## Usage

```ts
import { evaluatePosition } from '@kinghanzo/react-native-stockfish-lite';

const result = await evaluatePosition(fen);
// { scoreType: 'cp' | 'mate', score: number, depth: number, bestMove: string }
```

Scores use the side-to-move perspective. A positive score favors the player to
move; a negative score favors the opponent. Mate zero means the side to move is
already checkmated. `bestMove` is UCI notation.

The engine uses one thread, 16 MiB hash, depth up to 12, and a 100 ms search limit.
It returns the last completed evaluation, ignoring temporary score bounds.
Requests are serialized and execute off the UI thread. Initialization is lazy.

## Installation

Install from a pinned Git commit. This package contains its built JavaScript and
its compact network; installation does not require the wrapper's development tools.
The consuming React Native app generates native bindings for its own RN version.

Expo requires a rebuilt native development/production app. Expo Go cannot load
this custom native module. Android integration is tested with Expo SDK 57 and RN
0.86.2. The iOS bridge is implemented but still needs an Xcode/device build.

Private Git dependencies require GitHub access on every machine that installs
packages, including EAS Build. Keep credentials in the build environment, not in
package.json, lockfiles, or this repository.

## Development

```sh
npm install --ignore-scripts --workspaces=false
npm run build
bash prototype/build-android.sh --device
```

Commit the updated `lib/` JavaScript and type definitions when changing `src/`.
Do not commit native build outputs. See [PROTOTYPE.md](./PROTOTYPE.md) for pinned
upstream revisions, native build instructions, and measurements.

## Licenses and attribution

The original React Native wrapper is MIT licensed (LICENSE). Stockfish is
GPL-3.0-or-later (cpp/stockfish/Copying.txt). Engine contributor attribution is
preserved in cpp/stockfish/AUTHORS. The package's GPL designation does not remove
the wrapper's original MIT notice.
