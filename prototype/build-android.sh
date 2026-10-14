#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

stockfish_sdk="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
stockfish_ndk="${STOCKFISH_NDK:-$stockfish_sdk/ndk/27.1.12297006}"
stockfish_cmake="$stockfish_sdk/cmake/3.22.1/bin/cmake"
stockfish_build="prototype/build/android-library"

"$stockfish_cmake" -S android -B "$stockfish_build" -G Ninja \
  -DCMAKE_MAKE_PROGRAM="$stockfish_sdk/cmake/3.22.1/bin/ninja" \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_TOOLCHAIN_FILE="$stockfish_ndk/build/cmake/android.toolchain.cmake" \
  -DANDROID_ABI=arm64-v8a -DANDROID_PLATFORM=android-24 \
  -DANDROID_STL=c++_static -DSTOCKFISH_BUILD_SMOKE=ON
"$stockfish_cmake" --build "$stockfish_build" -j 4
"$stockfish_ndk/toolchains/llvm/prebuilt/darwin-x86_64/bin/llvm-strip" \
  --strip-unneeded "$stockfish_build/libreact-native-stockfish.so"

mkdir -p prototype/build/java/classes
javac --release 8 -d prototype/build/java/classes \
  prototype/java/com/loloof64/reactnativestockfish/ReactNativeStockfishModule.java
jar cf prototype/build/java/stockfish-lite-smoke.jar -C prototype/build/java/classes .
"$stockfish_sdk/build-tools/36.0.0/d8" --min-api 24 \
  --output prototype/build/java/stockfish-lite-smoke-dex.jar \
  prototype/build/java/stockfish-lite-smoke.jar

if [[ "${1:-}" == "--device" ]]; then
  adb push "$stockfish_build/libreact-native-stockfish.so" /data/local/tmp/libreact-native-stockfish-lite.so
  adb push prototype/build/java/stockfish-lite-smoke-dex.jar /data/local/tmp/puzzlemine-stockfish-lite.jar
fi
