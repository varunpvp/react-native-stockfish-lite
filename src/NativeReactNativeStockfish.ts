import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  evaluatePosition(
    fen: string,
    depth: number,
    maxTimeMs: number,
    maxNodes: number,
    multiPv: number,
    searchMoves: string[]
  ): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ReactNativeStockfish');
