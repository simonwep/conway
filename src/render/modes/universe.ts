export type UniverseMode = 'rust' | 'js';

export interface Universe {
    nextGen(): void;

    resurrected(): Uint32Array;

    killed(): Uint32Array;

    free(): void;

    setRuleset(resurrect: number, kill: number): void;
}
