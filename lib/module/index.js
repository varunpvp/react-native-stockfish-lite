"use strict";

import Stockfish from "./NativeReactNativeStockfish.js";
export async function evaluatePosition(fen, options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('options must be an object');
  }
  const {
    depth,
    maxTimeMs,
    maxNodes,
    multiPv = 1,
    searchMoves
  } = options;
  const validateInteger = (name, value, max) => {
    if (!Number.isSafeInteger(value) || value < 1 || value > max) {
      throw new RangeError(`${name} must be an integer between 1 and ${max}`);
    }
  };
  if (depth !== undefined) validateInteger('depth', depth, 245);
  if (maxTimeMs !== undefined) {
    validateInteger('maxTimeMs', maxTimeMs, 2147483647);
  }
  if (maxNodes !== undefined) {
    validateInteger('maxNodes', maxNodes, Number.MAX_SAFE_INTEGER);
  }
  validateInteger('multiPv', multiPv, 256);
  if (searchMoves !== undefined && (!Array.isArray(searchMoves) || searchMoves.length === 0 || Array.from(searchMoves).some(move => typeof move !== 'string' || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)))) {
    throw new TypeError('searchMoves must be a nonempty array of UCI moves');
  }
  const defaultLimits = depth === undefined && maxTimeMs === undefined && maxNodes === undefined;
  return JSON.parse(await Stockfish.evaluatePosition(fen, depth ?? (defaultLimits ? 12 : 0), maxTimeMs ?? (defaultLimits ? 100 : 0), maxNodes ?? 0, multiPv, searchMoves ?? []));
}
//# sourceMappingURL=index.js.map