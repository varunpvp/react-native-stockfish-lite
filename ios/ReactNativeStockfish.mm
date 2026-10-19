#import "ReactNativeStockfish.h"
#include "evaluate-position.h"

@implementation ReactNativeStockfish
RCT_EXPORT_MODULE(ReactNativeStockfish)

RCT_EXPORT_METHOD(evaluatePosition:(NSString *)fen
                  depth:(double)depth
                  maxTimeMs:(double)maxTimeMs
                  maxNodes:(double)maxNodes
                  multiPv:(double)multiPv
                  searchMoves:(NSArray<NSString *> *)searchMoves
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  const std::string position([fen UTF8String]);
  reactnativestockfish::EvaluationOptions options;
  options.depth = static_cast<int>(depth);
  options.maxTimeMs = static_cast<std::int64_t>(maxTimeMs);
  options.maxNodes = static_cast<std::uint64_t>(maxNodes);
  options.multiPv = static_cast<int>(multiPv);
  for (NSString *move in searchMoves) options.searchMoves.emplace_back([move UTF8String]);
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
    try {
      const auto result = reactnativestockfish::evaluate_position(position, options);
      resolve([NSString stringWithUTF8String:result.c_str()]);
    } catch (const std::exception& error) {
      reject(@"STOCKFISH_EVALUATION_FAILED", [NSString stringWithUTF8String:error.what()], nil);
    }
  });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeReactNativeStockfishSpecJSI>(params);
}
@end
