import type { TurboModule } from 'react-native';
export interface Spec extends TurboModule {
    evaluatePosition(fen: string, depth: number, maxTimeMs: number, maxNodes: number, multiPv: number, searchMoves: string[]): Promise<string>;
}
declare const _default: Spec;
export default _default;
//# sourceMappingURL=NativeReactNativeStockfish.d.ts.map