// Exercise the browser branch of the shipped engine with local static assets.
const { parentPort, workerData } = require('node:worker_threads');
const { readFile } = require('node:fs/promises');
const vm = require('node:vm');
const path = require('node:path');
const assets = path.resolve(__dirname, '../../web');
const location = new URL(workerData, 'https://example.test');
const scope = vm.createContext({
  location,
  console,
  WebAssembly,
  WorkerGlobalScope: class {},
  URL,
  Response,
  Headers,
  ReadableStream,
  performance,
  setTimeout,
  clearTimeout,
  TextDecoder,
  TextEncoder,
  onmessage: null,
  postMessage: (data) => parentPort.postMessage(data),
  fetch: async (url) => {
    const asset = new URL(url, location);
    if (asset.pathname !== '/stockfish/stockfish-19-lite-single.wasm')
      throw Error(asset.href);
    return new Response(
      await readFile(path.join(assets, path.basename(asset.pathname))),
      {
        headers: { 'Content-Type': 'application/wasm' },
      }
    );
  },
});
scope.self = scope;
(async () => {
  if (location.pathname !== '/stockfish/stockfish-19-lite-single.js')
    throw Error(location.href);
  vm.runInContext(
    await readFile(path.join(assets, path.basename(location.pathname)), 'utf8'),
    scope
  );
  parentPort.on('message', (data) => scope.onmessage({ data }));
})();
