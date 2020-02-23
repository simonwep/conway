export class RustUniverse {

    cols = 0;
    rows = 0;
    wasm = null;
    universe = null;

    constructor(cols, rows, universe, wasm) {
        this.rows = rows;
        this.cols = cols;
        this.universe = universe;
        this.wasm = wasm;
    }

    static async new(cols, rows) {
        const [{Universe}, wasm] = await Promise.all([
            import('../../crate/pkg'),
            import('../../crate/pkg/index_bg.wasm')
        ]);

        return new RustUniverse(
            cols, rows,
            Universe.new(cols, rows),
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
