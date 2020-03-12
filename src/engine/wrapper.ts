import {Universe} from '../../crate/pkg';

export class UniverseWrapper {

    private readonly cols: number;
    private readonly rows: number;

    /* eslint-disable @typescript-eslint/no-explicit-any */
    private readonly wasm: any;
    private readonly universe: Universe;

    // Buffer containing coordinates for resurrected and killed cells
    public readonly killedCellsBuffer: Uint32Array;
    public readonly resurrectedCellsBuffer: Uint32Array;

    constructor(rows: number, cols: number, universe: Universe, wasm: any) {
        this.rows = rows;
        this.cols = cols;
        this.universe = universe;
        this.wasm = wasm;

        const bufferSize = universe.total_cells();
        const wasmMemory = wasm.memory.buffer;

        this.killedCellsBuffer = new Uint32Array(
            wasmMemory, universe.killed_cells(), bufferSize
        );

        this.resurrectedCellsBuffer = new Uint32Array(
            wasmMemory, universe.resurrected_cells(), bufferSize
        );
    }

    public static async new(rows: number, cols: number): Promise<UniverseWrapper> {
        const [{Universe}, wasm] = await Promise.all([
            import(/* webpackChunkName: "crate-wrapper" */ '../../crate/pkg'),
            import(/* webpackChunkName: "crate-wasm" */ '../../crate/pkg/index_bg.wasm')
        ]);

        return new UniverseWrapper(
            rows, cols,
            Universe.new(rows, cols),
            wasm
        );
    }

    public free(): void {
        this.universe.free();
    }

    public setRuleset(resurrect: number, survive: number): void {
        this.universe.set_ruleset(resurrect, survive);
    }

    public nextGen(): void {
        this.universe.next_gen();
    }

    get resurrected() {
        return this.universe.resurrected_cells_amount();
    }

    get killed() {
        return this.universe.killed_cells_amount();
    }
}
