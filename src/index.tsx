import Stockfish from './NativeReactNativeStockfish';

export type EvaluationOptions = {
  /** Maximum depth (1–245). */
  depth?: number;
  /** Search budget in milliseconds; excludes initialization and queue time. */
  maxTimeMs?: number;
  /** Maximum nodes searched. */
  maxNodes?: number;
  /** Number of candidate lines (1–256), default 1. */
  multiPv?: number;
  /** Nonempty list of legal root moves in UCI notation. */
  searchMoves?: string[];
};

export type EvaluationLine = {
  rank: number;
  scoreType: 'cp' | 'mate';
  score: number;
  depth: number;
  moves: string[];
};

export type PositionEvaluation = {
  scoreType: 'cp' | 'mate';
  score: number;
  depth: number;
  bestMove: string;
  lines: EvaluationLine[];
};

export async function evaluatePosition(
  fen: string,
  options: EvaluationOptions = {}
): Promise<PositionEvaluation> {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('options must be an object');
  }
  const { depth, maxTimeMs, maxNodes, multiPv = 1, searchMoves } = options;
  const validateInteger = (name: string, value: number, max: number) => {
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
  if (
    searchMoves !== undefined &&
    (!Array.isArray(searchMoves) ||
      searchMoves.length === 0 ||
      Array.from(searchMoves).some(
        (move) =>
          typeof move !== 'string' ||
          !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)
      ))
  ) {
    throw new TypeError('searchMoves must be a nonempty array of UCI moves');
  }

  const defaultLimits =
    depth === undefined && maxTimeMs === undefined && maxNodes === undefined;
  return JSON.parse(
    await Stockfish.evaluatePosition(
      fen,
      depth ?? (defaultLimits ? 12 : 0),
      maxTimeMs ?? (defaultLimits ? 100 : 0),
      maxNodes ?? 0,
      multiPv,
      searchMoves ?? []
    )
  );
}
