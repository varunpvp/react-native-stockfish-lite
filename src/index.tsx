import Stockfish from './NativeReactNativeStockfish';

export type PositionEvaluation = {
  scoreType: 'cp' | 'mate';
  score: number;
  depth: number;
  bestMove: string;
};

export async function evaluatePosition(fen: string): Promise<PositionEvaluation> {
  return JSON.parse(await Stockfish.evaluatePosition(fen));
}
