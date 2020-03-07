import {Universe} from '../../../crate/pkg';

export class UniverseWrapper {

    private readonly cols: number;
    private readonly rows: number;

    /* eslint-disable @typescript-eslint/no-explicit-any */
    private readonly wasm: any;
    private readonly universe: Universe;

    constructor(rows: number, cols: number, universe: Universe, wasm: unknown) {
        this.rows = rows;
        this.cols = cols;
        this.universe = universe;
        this.wasm = wasm;
    }

    public static async new(rows: number, cols: number): Promise<UniverseWrapper> {
        const [{Universe}, wasm] = await Promise.all([
            import(/* webpackChunkName: "crate-wrapper" */ '../../../crate/pkg'),
            import(/* webpackChunkName: "crate-wasm" */ '../../../crate/pkg/index_bg.wasm')
        ]);

        return new UniverseWrapper(
            rows, cols,
            Universe.new(rows, cols),
            wasm
        );
    }

    public nextGen(): void {
        this.universe.next_gen();
    }

    public resurrected(): Uint32Array {
        return new Uint32Array(
            this.wasm.memory.buffer,
            this.universe.resurrected_cells(),
            this.universe.resurrected_cells_amount() * 2
        );
    }

    public killed(): Uint32Array {
        return new Uint32Array(
            this.wasm.memory.buffer,
            this.universe.killed_cells(),
            this.universe.killed_cells_amount() * 2
        );
    }

    public free(): void {
        this.universe.free();
    }

    public setRuleset(resurrect: number, survive: number): void {
        this.universe.set_ruleset(resurrect, survive);
    }
}
