"use strict";

import Stockfish from "./NativeReactNativeStockfish.js";
import { evaluateWith } from "./evaluation.js";
export function evaluatePosition(fen, options) {
  return evaluateWith(Stockfish, fen, options);
}
//# sourceMappingURL=index.js.map