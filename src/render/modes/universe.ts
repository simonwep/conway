import {JSUniverse}   from './javascript';
import {RustUniverse} from './rust';

export type UniverseMode = 'rust' | 'js';

export interface Universe {
    nextGen(): void;

    resurrected(): Uint32Array;

    killed(): Uint32Array;

    free(): void;

    setRuleset(resurrect: number, kill: number): void;
}

export const createUniverse = async (name: UniverseMode, cols: number, rows: number): Promise<Universe> => {
    switch (name) {
        case 'rust':
            return RustUniverse.new(cols, rows);
        case 'js':
            return JSUniverse.new(cols, rows);
        default:
            throw new Error(`Unknown mode: ${name}`);
    }
};
