"use strict";

import Stockfish from "./NativeReactNativeStockfish.js";
export async function evaluatePosition(fen) {
  return JSON.parse(await Stockfish.evaluatePosition(fen));
}
//# sourceMappingURL=index.js.map