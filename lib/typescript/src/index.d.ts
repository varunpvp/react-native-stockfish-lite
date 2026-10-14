export type PositionEvaluation = {
    scoreType: 'cp' | 'mate';
    score: number;
    depth: number;
    bestMove: string;
};
export declare function evaluatePosition(fen: string): Promise<PositionEvaluation>;
//# sourceMappingURL=index.d.ts.map