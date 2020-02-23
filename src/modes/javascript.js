export class JSUniverse {

    cols = 0;
    rows = 0;
    source = null;
    target = null;
    killedCellsBuffer = null;
    resurrectedCellsBuffer = null;
    killedCells = null;
    resurrectedCells = null;
    killedCellsAmount = 0;
    resurrectedCellsAmount = 0;
    swap = false;

    constructor(cols, rows) {
        const totalCells = cols * rows + rows * 2 + cols * 2;
        const source = new Uint8Array(totalCells);
        const target = new Uint8Array(totalCells);

        // Randomize cells
        for (let row = 1; row < rows; row++) {
            const offset = row * cols;

            for (let col = 1; col < cols; col++) {
                source[offset + col] = Math.random() > 0.75 ? 1 : 0;
            }
        }

        this.rows = rows;
        this.cols = cols;
        this.source = source;
        this.target = target;
        this.killedCellsBuffer = new ArrayBuffer(totalCells * 2 * 4);
        this.resurrectedCellsBuffer = new ArrayBuffer(totalCells * 2 * 4);
        this.killedCells = new Uint32Array(this.killedCellsBuffer);
        this.resurrectedCells = new Uint32Array(this.resurrectedCellsBuffer);
    }

    static async new(cols, rows) {
        return Promise.resolve(new JSUniverse(cols, rows));
    }

    nextGen() {
        const {resurrectedCells, killedCells, source, target, swap, rows, cols} = this;
        const [src, tar] = swap ? [target, source] : [source, target];
        this.resurrectedCellsAmount = 0;
        this.killedCellsAmount = 0;

        for (let row = 1; row < rows; row++) {
            const offset = row * cols;
            const top = (row - 1) * cols + 1;
            const bottom = (row + 1) * cols + 1;

            // Build 3x3 bit mask, the mask contains the state of the three cells
            // Below and above the current row.
            // TL TM X << X will be updated at each iteration (and others shifted to left)
            // ML MM X
            // BL BM X
            let mask =
                (src[top - 1] ? 32 : 0) + (src[top] ? 4 : 0) +
                (src[offset - 1] ? 16 : 0) + (src[offset] ? 2 : 0) +
                (src[bottom - 1] ? 8 : 0) + (src[bottom] ? 1 : 0);

            // Mask.printMatrix();
            for (let col = 1; col < cols; col++) {
                const middle = offset + col;

                // Shift previously saved information to the left and make room
                // For 3 additional bits (which will be used for the middle row).
                mask = ((mask << 3) & 0b111111111) + // Make room for three more bits
                    (src[top + col] ? 4 : 0) + // TR
                    (src[middle + 1] ? 2 : 0) + // MR
                    (src[bottom + col] ? 1 : 0); // BR

                // Lookup bits
                const neighbors = (mask & 0b1) +
                    (mask >> 1 & 0b1) +
                    (mask >> 2 & 0b1) +
                    (mask >> 3 & 0b1) +
                    (mask >> 5 & 0b1) +
                    (mask >> 6 & 0b1) +
                    (mask >> 7 & 0b1) +
                    (mask >> 8 & 0b1) +
                    (mask >> 9 & 0b1);

                const cell = src[middle];
                const next = (
                    cell ?
                        // Any live cell with fewer than two live neighbours dies, as if by underpopulation.
                        // Any live cell with two or three live neighbours lives on to the next generation.
                        // Any live cell with more than three live neighbours dies, as if by overpopulation.
                        (neighbors < 4 && neighbors > 1) :

                        // Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
                        neighbors === 3
                ) ? 1 : 0;

                // Save state
                tar[middle] = next;

                if (cell !== next) {
                    if (next) {
                        resurrectedCells[this.resurrectedCellsAmount++] = row;
                        resurrectedCells[this.resurrectedCellsAmount++] = col;
                    } else {
                        killedCells[this.killedCellsAmount++] = row;
                        killedCells[this.killedCellsAmount++] = col;
                    }
                }
            }
        }

        this.swap = !swap;
    }

    resurrected() {
        return new Uint32Array(
            this.resurrectedCellsBuffer,
            0,
            this.resurrectedCellsAmount
        );
    }

    killed() {
        return new Uint32Array(
            this.killedCellsBuffer,
            0,
            this.killedCellsAmount
        );
    }
}


