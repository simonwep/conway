import {Universe} from '../../crate/pkg';

export class UniverseWrapper {

    // Bitmap
    private height: number;
    private width: number;
    private cols: number;
    private rows: number;

    /* eslint-disable @typescript-eslint/no-explicit-any */
    private readonly wasm: any;
    private readonly universe: Universe;

    constructor(
        rows: number,
        cols: number,
        width: number,
        height: number,
        universe: Universe,
        wasm: any
    ) {
        this.height = height;
        this.width = width;
        this.rows = rows;
        this.cols = cols;
        this.universe = universe;
        this.wasm = wasm;
    }

    public get imageData(): ImageData {
        return new ImageData(
            new Uint8ClampedArray(
                this.wasm.memory.buffer,
                this.universe.image_data(),
                this.universe.image_size()
            ), this.width, this.height
        );
    }

    public static async new(rows: number, cols: number, width: number, height: number): Promise<UniverseWrapper> {
        const [{Universe}, wasm] = await Promise.all([
            import(/* webpackChunkName: "crate-wrapper" */ '../../crate/pkg'),
            import(/* webpackChunkName: "crate-wasm" */ '../../crate/pkg/index_bg.wasm')
        ]);

        return new UniverseWrapper(
            rows, cols, width, height,
            Universe.new(rows, cols),
            wasm
        );
    }

    public resize(rows: number, cols: number, width: number, height: number): void {
        this.universe.resize(rows, cols);
        this.height = height;
        this.width = width;
        this.rows = rows;
        this.cols = cols;
    }

    public free(): void {
        this.universe.free();
    }

    public setRuleset(resurrect: number, survive: number): void {
        this.universe.set_ruleset(resurrect, survive);
    }

    public killedCells(): number {
        return this.universe.killed_cells();
    }

    public resurrectedCells(): number {
        return this.universe.resurrected_cells();
    }

    public nextGen(): void {
        this.universe.next_gen();
    }

    public currentGen(): Uint8Array {
        return new Uint8Array(
            this.wasm.memory.buffer,
            this.universe.current_gen(),
            this.universe.cell_count()
        );
    }

    public loadUnsafe(data: Uint8Array): void {
        this.universe.load_unsafe(data);
    }

    public setCell(x: number, y: number, state: boolean): void {
        this.universe.set_cell(x, y, state);
    }
}
