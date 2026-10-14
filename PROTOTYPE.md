# Native Stockfish lite prototype

This maintained library started as an isolated ReactNativeStockfish prototype.
The app now uses its Promise-based FEN evaluation API for open-ended move checks.
Raw UCI streaming remains only in the prototype runners.

## Pinned sources

- Wrapper: loloof64/ReactNativeStockfish at `b2bd176e820e4cd7e96918fc1f292d38e3dcfeb5`.
- Engine: nmrugg/stockfish.js **v19.0.1**, commit `0d5dd7944f88c817c07a26bc4fb1905d5f9c46d6`.
- Embedded network: `cpp/nn-61e7af4bb97d.nnue`, 1,166,381 bytes.
- Network SHA-256: `61e7af4bb97d51eeeb25d322916f86513b5cd3a827ce189c98c6e31946f99e5b`.

The network was downloaded once while preparing these sources. It is included
in the package and compiled into the native engine. There is no network download
at app startup, no WebView, and no WASM runtime.

## Changes

- Replaced the vendored Stockfish 17 engine with the pinned lite-capable source.
- Enabled `USE_LITE_NET`; only the matching P_hm feature implementation is compiled.
- Android CMake embeds the bundled network, verifies its checksum, and no longer downloads the full networks.
- Updated the iOS podspec to use the same bundled network and lite definitions.
- Kept the wrapper's stream adaptation, renamed `main` to `stockfish_core`, and corrected the native UCI loop's pointer call.
- Disabled Syzygy and guarded its unused PV extension, which otherwise caused an Android link error.
- Buffered native output into complete lines and made output/error reads nonblocking.
- Added a native runner and a Java/JNI driver so the actual Android shared library can be tested without changing or installing the app.
- Retained the wrapper's MIT license and included the engine's GPL notice and AUTHORS.

## Build and run on macOS with the Android SDK

```sh
bash prototype/build-android.sh --device
python3 prototype/benchmark.py --jni --output prototype/results/samsung-jni-depth12.json
python3 prototype/benchmark.py --jni --movetime 100 --output prototype/results/samsung-jni-100ms.json
```

The script defaults to Android NDK 27.1.12297006, CMake 3.22.1 and build-tools
36.0.0. Set `ANDROID_HOME` and `STOCKFISH_NDK` if installed elsewhere.
The runner loads the library from `/data/local/tmp`; no standalone NNUE is copied
to the phone. These are CLI prototype tests, not a React Native screen test.

## Initial Android measurements

Samsung SM-M356B, Android 16, ARM64. One engine thread, 16 MiB hash,
MultiPV 1, depth 12, five runs of each position. Hash cleared between runs.
Elapsed time includes the Java/JNI driver and USB response delivery.

| Position | Median | Slowest | Evaluation from White's perspective |
| --- | ---: | ---: | --- |
| Before 29...Qd7 | 121 ms | 153 ms | +0.55 |
| After 29...Qd7 | 23 ms | 23 ms | +4.49 |
| Knight-fork opportunity | 74 ms | 76 ms | +2.42; best move Nf7 |
| After missing the fork with Qe3 | 117 ms | 118 ms | -3.78 |

All twenty runs reached depth 12 and returned identical scores and best moves
for each position. This establishes feasibility on these examples, not accuracy
across every position. Lite scores can differ from the backend's full engine;
future move grading should evaluate the baseline with this engine too.

The original prototype's stripped ARM64 Android library was **2,610,568 bytes (2.61 MB / 2.49 MiB)**,
including the embedded network and static C++ runtime. Its DEFLATE size is
approximately **1.47 MB**. The production FEN helper adds about 12 KB. Android ELF load segments use 16 KiB alignment.

These are native library measurements, not a measured final APK/AAB increase.
Store downloads may compress libraries differently, and a universal APK includes
more than one ABI. Raw outputs are in `prototype/results/`.

With an additional 100 ms search cap, the slower positions completed depth 11
and the faster positions completed depth 12. The same best moves and the same
clear distinction between good and bad positions remained. The benchmark uses
the last completed score and excludes UCI `lowerbound`/`upperbound` updates.
Delivery overhead brought the longest capped request to about 106 ms.

The JavaScript/type-definition build passes. A package dry run contains exactly
one NNUE file: the compact network above. Only that network's filename appears
in the compiled Android library.

## Remaining before app integration

- Android Expo/RN integration passes: autolinking, native compilation, and Promise calls on Samsung.
  The API avoids raw-engine start/stop and event-stream lifecycle handling.
- Measure a complete release APK/AAB before and after integration.
- Build and test iOS on Xcode/device. Only podspec syntax and the macOS native
  engine build have been checked; this machine currently has Command Line Tools.
- Install private repository commits with GitHub access configured in local and cloud build environments.

The native evaluation function uses one background search thread and serializes
requests. The app re-evaluates the baseline with the same lite engine before
grading unknown moves. The cloud and backend evaluation fallback are removed.

## React Native integration verification

Expo SDK 57 / React Native 0.86.2 Android debug build succeeds. Concurrent Promise
requests were tested on Samsung: Qd7 aftermath returns a winning White score;
Nf7 is suggested for the fork; an already checkmated side returns mate zero;
an invalid FEN rejects the Promise without crashing. App grading and score
perspective/cancellation tests also pass.
