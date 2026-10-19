package com.loloof64.reactnativestockfish

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.module.annotations.ReactModule
import java.util.concurrent.Executors

@ReactModule(name = ReactNativeStockfishModule.NAME)
class ReactNativeStockfishModule(reactContext: ReactApplicationContext) :
  NativeReactNativeStockfishSpec(reactContext) {

  private val executor = Executors.newSingleThreadExecutor()
  private external fun evaluateFen(
    fen: String, depth: Double, maxTimeMs: Double, maxNodes: Double,
    multiPv: Double, searchMoves: Array<String>
  ): String

  override fun getName() = NAME

  override fun evaluatePosition(
    fen: String, depth: Double, maxTimeMs: Double, maxNodes: Double,
    multiPv: Double, searchMoves: ReadableArray, promise: Promise
  ) {
    val moves = Array(searchMoves.size()) { searchMoves.getString(it)!! }
    executor.execute {
      try {
        promise.resolve(evaluateFen(fen, depth, maxTimeMs, maxNodes, multiPv, moves))
      } catch (error: Exception) {
        promise.reject("STOCKFISH_EVALUATION_FAILED", error.message, error)
      }
    }
  }

  override fun invalidate() {
    executor.shutdown()
    super.invalidate()
  }

  companion object {
    const val NAME = "ReactNativeStockfish"
    init { System.loadLibrary("react-native-stockfish") }
  }
}
