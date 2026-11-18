/// <reference lib="dom" />
import type { EvaluationLine, PositionEvaluation } from './evaluation';
import type { Spec } from './NativeReactNativeStockfish';

const workerPath = '/stockfish/stockfish-19-lite-single.js';

class BrowserEngine {
  private worker = new Worker(workerPath);
  private receive?: (line: string) => void;
  private fail?: (error: Error) => void;
  private failure?: Error;

  constructor() {
    this.worker.onmessage = ({ data }) => {
      for (const line of String(data).split('\n')) this.receive?.(line.trim());
    };
    this.worker.onerror = (event) => {
      this.failure = new Error(
        event.message || 'Stockfish worker failed to load'
      );
      this.fail?.(this.failure);
    };
  }

  close() {
    this.worker.terminate();
  }

  command(
    commands: string[],
    accept: (line: string) => boolean,
    timeout?: number
  ) {
    return new Promise<void>((resolve, reject) => {
      if (this.failure) return reject(this.failure);
      const finish = (error?: Error) => {
        clearTimeout(timer);
        this.receive = undefined;
        this.fail = undefined;
        if (error) reject(error);
        else resolve();
      };
      const timer =
        timeout &&
        setTimeout(
          () => finish(new Error('Stockfish did not respond')),
          timeout
        );
      this.fail = finish;
      this.receive = (line) => {
        if (line.startsWith('info string CRITICAL ERROR:'))
          finish(new Error(line));
        else if (accept(line)) finish();
      };
      for (const command of commands) this.worker.postMessage(command);
    });
  }
}

let engine: BrowserEngine | undefined;
let queue = Promise.resolve();

const evaluatePosition: Spec['evaluatePosition'] = (...args) => {
  const request = queue.then(() => evaluate(...args));
  queue = request.then(
    () => {},
    () => {}
  );
  return request;
};

async function evaluate(
  ...[fen, depth, time, nodes, multiPv, moves]: Parameters<
    Spec['evaluatePosition']
  >
) {
  if (
    typeof fen !== 'string' ||
    !fen.trim() ||
    /[\r\n]/.test(fen) ||
    /\bmoves\b/.test(fen)
  ) {
    throw new Error('Invalid FEN');
  }
  try {
    if (!engine) {
      engine = new BrowserEngine();
      await engine.command(['uci'], (line) => line === 'uciok', 30000);
    }
    await engine.command(
      ['ucinewgame', 'setoption name MultiPV value ' + multiPv, 'isready'],
      (line) => line === 'readyok',
      30000
    );

    // Perft at depth one yields legal root moves, including promotions.
    const legal = new Set<string>();
    await engine.command(
      ['position fen ' + fen, 'go perft 1'],
      (line) => {
        const move = /^([a-h][1-8][a-h][1-8][qrbn]?): 1$/.exec(line);
        if (move) legal.add(move[1]!);
        return line.startsWith('Nodes searched:');
      },
      30000
    );
    const roots = [...new Set(moves)];
    for (const move of roots) {
      if (!legal.has(move)) throw new Error('Illegal search move: ' + move);
    }
    const count = Math.min(multiPv, roots.length || legal.size);
    const limits = ['go'];
    if (depth) limits.push('depth', String(depth));
    if (time) limits.push('movetime', String(time));
    if (nodes) limits.push('nodes', String(nodes));
    if (roots.length) limits.push('searchmoves', ...roots);

    let result: PositionEvaluation | undefined;
    let batch: EvaluationLine[] = [];
    await engine.command([limits.join(' ')], (line) => {
      if (line.startsWith('bestmove ')) return true;
      const info = /^info depth (\d+)\b.*?\bscore (cp|mate) (-?\d+)\b/.exec(
        line
      );
      if (!info) return false;
      const score = Number(info[3]);
      const scoreType = info[2] as EvaluationLine['scoreType'];
      const d = Number(info[1]);
      if (!count && d === 0) {
        result = { depth: d, score, scoreType, bestMove: '(none)', lines: [] };
        return false;
      }
      const rank = Number(/\bmultipv (\d+)/.exec(line)?.[1]);
      const pv = /\bpv (.+)$/.exec(line)?.[1]?.split(/\s+/);
      if (rank === 1) batch = [];
      if (
        !pv ||
        /\b(upperbound|lowerbound)\b/.test(line) ||
        rank !== batch.length + 1 ||
        (rank > 1 && batch[0]?.depth !== d)
      ) {
        batch = [];
        return false;
      }
      batch.push({ rank, scoreType, score, depth: d, moves: pv });
      if (rank === count && d >= (result?.depth ?? -1)) {
        const top = batch[0]!;
        result = {
          scoreType: top.scoreType,
          score: top.score,
          depth: d,
          bestMove: top.moves[0]!,
          lines: batch.slice(),
        };
      }
      return false;
    });
    if (!result) throw new Error('Stockfish returned no completed evaluation');
    return JSON.stringify(result);
  } catch (error) {
    engine?.close();
    engine = undefined;
    throw error;
  }
}

export default { evaluatePosition };
