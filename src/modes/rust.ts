import {Universe} from './universe';

/* eslint-disable @typescript-eslint/no-explicit-any */
export class RustUniverse implements Universe {

    private readonly cols: number;
    private readonly rows: number;
    private readonly wasm: any;
    private readonly universe: any;

    constructor(rows: number, cols: number, universe: unknown, wasm: unknown) {
        this.rows = rows;
        this.cols = cols;
        this.universe = universe;
        this.wasm = wasm;
    }

    static async new(rows: number, cols: number): Promise<RustUniverse> {
        const [{Universe}, wasm] = await Promise.all([
            import('../../crate/pkg/index'),
            import('../../crate/pkg/index_bg.wasm')
        ]);

        return new RustUniverse(
            rows, cols,
            Universe.new(rows, cols),
            wasm
        );
    }

    nextGen(): void {
        this.universe.next_gen();
    }

    resurrected(): Uint32Array {
        return new Uint32Array(
            this.wasm.memory.buffer,
            this.universe.resurrected_cells(),
            this.universe.resurrected_cells_amount() * 2
        );
    }

    killed(): Uint32Array {
        return new Uint32Array(
            this.wasm.memory.buffer,
            this.universe.killed_cells(),
            this.universe.killed_cells_amount() * 2
        );
    }

    free(): void {
        this.universe.free();
    }

    setRuleset(resurrect: number, survive: number): void {
        this.universe.set_ruleset(resurrect, survive);
    }
}
