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
        this.totalCells = cols * rows + rows * 2 + cols * 2;
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

    cells() {
        return new Int32Array(
            this.wasm.memory.buffer,
            this.universe.updated_cells(),
            this.universe.update_count() * 3
        );
    }
}
