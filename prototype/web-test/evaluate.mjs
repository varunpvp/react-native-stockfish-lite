import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { evaluatePosition } from '@kinghanzo/react-native-stockfish-lite';

const workers = new Set();
globalThis.Worker = class {
  constructor(url) {
    this.worker = new Worker(new URL('./worker.cjs', import.meta.url), {
      workerData: url,
    });
    workers.add(this.worker);
    this.worker.on('message', (data) => this.onmessage?.({ data }));
    this.worker.on('error', (error) => this.onerror?.(error));
  }
  postMessage(command) {
    this.worker.postMessage(command);
  }
  terminate() {
    this.worker.terminate();
  }
};
const start = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
try {
  const [filtered, normal] = await Promise.all([
    evaluatePosition(start, {
      depth: 4,
      multiPv: 4,
      searchMoves: ['e2e4', 'd2d4', 'd2d4'],
    }),
    evaluatePosition(start),
  ]);
  assert.equal(filtered.depth, 4);
  assert.deepEqual(
    filtered.lines.map((l) => l.rank),
    [1, 2]
  );
  assert.deepEqual(filtered.lines.map((l) => l.moves[0]).sort(), [
    'd2d4',
    'e2e4',
  ]);
  assert.equal(filtered.bestMove, filtered.lines[0].moves[0]);
  assert(normal.depth >= 1);
  await assert.rejects(
    evaluatePosition(start, { searchMoves: ['a1a8'] }),
    /Illegal search move/
  );
  await assert.rejects(evaluatePosition('invalid fen'));
  for (const [fen, scoreType] of [
    ['7k/6Q1/6K1/8/8/8/8/8 b - - 0 1', 'mate'],
    ['7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', 'cp'],
  ]) {
    assert.deepEqual(await evaluatePosition(fen), {
      depth: 0,
      scoreType,
      score: 0,
      bestMove: '(none)',
      lines: [],
    });
  }
  console.log('Browser entry and Stockfish WASM integration passed');
} finally {
  await Promise.all([...workers].map((worker) => worker.terminate()));
}
