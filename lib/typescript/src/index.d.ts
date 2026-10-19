export type EvaluationOptions = {
    /** Maximum depth (1–245). */
    depth?: number;
    /** Search budget in milliseconds; excludes initialization and queue time. */
    maxTimeMs?: number;
    /** Maximum nodes searched. */
    maxNodes?: number;
    /** Number of candidate lines (1–256), default 1. */
    multiPv?: number;
    /** Nonempty list of legal root moves in UCI notation. */
    searchMoves?: string[];
};
export type EvaluationLine = {
    rank: number;
    scoreType: 'cp' | 'mate';
    score: number;
    depth: number;
    moves: string[];
};
export type PositionEvaluation = {
    scoreType: 'cp' | 'mate';
    score: number;
    depth: number;
    bestMove: string;
    lines: EvaluationLine[];
};
export declare function evaluatePosition(fen: string, options?: EvaluationOptions): Promise<PositionEvaluation>;
//# sourceMappingURL=index.d.ts.map