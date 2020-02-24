export class RustUniverse {

    cols = 0;
    rows = 0;
    wasm = null;
    universe = null;

    constructor(rows, cols, universe, wasm) {
        this.rows = rows;
        this.cols = cols;
        this.universe = universe;
        this.wasm = wasm;
    }

    static async new(rows, cols) {
        const [{Universe}, wasm] = await Promise.all([
            import('../../crate/pkg'),
            import('../../crate/pkg/index_bg.wasm')
        ]);

        return new RustUniverse(
            rows, cols,
            Universe.new(rows, cols),
            wasm
        );
    }

    nextGen() {
        this.universe.next_gen();
    }

    resurrected() {
        return new Uint32Array(
            this.wasm.memory.buffer,
            this.universe.resurrected_cells(),
            this.universe.resurrected_cells_amount() * 2
        );
    }

    killed() {
        return new Uint32Array(
            this.wasm.memory.buffer,
            this.universe.killed_cells(),
            this.universe.killed_cells_amount() * 2
        );
    }
}
