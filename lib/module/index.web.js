"use strict";

import Stockfish from "./browserEngine.js";
import { evaluateWith } from "./evaluation.js";
export function evaluatePosition(fen, options) {
  return evaluateWith(Stockfish, fen, options);
}
//# sourceMappingURL=index.web.js.map