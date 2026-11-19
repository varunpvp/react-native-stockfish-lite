import Stockfish from './NativeReactNativeStockfish';
import { evaluateWith, type EvaluationOptions } from './evaluation';

export type {
  EvaluationLine,
  EvaluationOptions,
  PositionEvaluation,
} from './evaluation';

export function evaluatePosition(fen: string, options?: EvaluationOptions) {
  return evaluateWith(Stockfish, fen, options);
}
