# Native Stockfish Lite

Private maintained copy of [ReactNativeStockfish](https://github.com/loloof64/ReactNativeStockfish),
using the compact Stockfish.js v19.0.1 engine and its embedded 1.1 MB network.
Android and iOS run the engine natively. Web runs the bundled single-threaded
Stockfish.js build in a dedicated worker.

## Usage

```ts
import { evaluatePosition } from '@kinghanzo/react-native-stockfish-lite';

const result = await evaluatePosition(fen);
// { scoreType, score, depth, bestMove, lines }

const analysis = await evaluatePosition(fen, {
  depth: 20,
  maxTimeMs: 1500,
  multiPv: 3,
});
// Existing fields describe the strongest returned line.
analysis.bestMove;
analysis.lines[1]?.moves; // Second-best continuation, as UCI moves
```

Scores use the side-to-move perspective. A positive score favors the player to
move; a negative score favors the opponent. Mate zero means the side to move is
already checkmated. `bestMove` and principal variation moves use UCI notation.

All fields in the optional second argument are optional:

| Option        | Meaning                                  | Accepted values                      |
| ------------- | ---------------------------------------- | ------------------------------------ |
| `depth`       | Maximum search depth                     | Integer, 1–245                       |
| `maxTimeMs`   | Search budget in milliseconds            | Integer, 1–2,147,483,647             |
| `maxNodes`    | Maximum nodes searched                   | Integer, 1–`Number.MAX_SAFE_INTEGER` |
| `multiPv`     | Candidate lines requested; defaults to 1 | Integer, 1–256                       |
| `searchMoves` | Restrict analysis to legal root moves    | Nonempty array of UCI moves          |

Without a search limit, the defaults remain depth 12 and 100 ms. Supplying any
limit applies only the supplied limits; search stops when the first is reached.
`maxTimeMs` excludes initialization and queue time and is not a strict Promise
deadline. Time and node limits can be exceeded slightly. Invalid options or
illegal moves reject the Promise; duplicate moves are evaluated once.

Results retain `scoreType`, `score`, `depth`, and `bestMove`, and add `lines`.
Each line contains `{ rank, scoreType, score, depth, moves }`, ranked strongest
first (`rank: 1`), with `moves` containing the principal variation. All scores
use the input position's side-to-move perspective. The top-level fields match
the strongest returned line. The latest complete set at a common depth is
returned, which may be shallower than requested or contain fewer legal candidates.
If no evaluation completes, the Promise rejects. Checkmate and stalemate return
`depth: 0`, `bestMove: '(none)'`, and `lines: []`.

The engine uses one thread and 16 MiB hash. Requests are serialized and execute
off the UI thread. Initialization is lazy. Rebuild your native app after updating
the package to use the new bridge signature on Android and iOS.

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

## Web setup

From the consuming Expo or web app, copy both packaged engine assets into its
static directory before starting the dev server or exporting the site:

```sh
mkdir -p public/stockfish
cp node_modules/@kinghanzo/react-native-stockfish-lite/web/stockfish-19-lite-single.* public/stockfish/
```

Serve these files at `/stockfish/` on the app’s origin, with
`application/wasm` for the WASM file. Repeat the copy when upgrading the
library. The browser package export exposes the same `evaluatePosition` API
shown above. The worker starts on the first evaluation and loads its adjacent
WASM file. Single-threaded execution works without cross-origin isolation.

The two engine assets come from the `stockfish@19.0.1` npm distribution,
under GPLv3. See [the corresponding upstream source](https://github.com/nmrugg/stockfish.js/tree/0d5dd7944f88c817c07a26bc4fb1905d5f9c46d6).

To exercise the built browser entry against the actual WASM locally, run
`node --conditions=browser prototype/web-test/evaluate.mjs` using Node 22.

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
