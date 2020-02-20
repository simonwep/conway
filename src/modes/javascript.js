export class JSUniverse {

    cols = 0;
    rows = 0;
    totalCells = 0;
    source = null;
    target = null;
    swap = false;

    constructor(cols, rows) {
        const totalCells = cols * rows + rows * 2 + cols * 2;
        const source = new Uint8Array(totalCells);
        const target = new Uint8Array(totalCells);

        // Randomize cells
        for (let row = 1; row < rows; row++) {
            const offset = row * cols;

            for (let col = 1; col < cols; col++) {
                source[offset + col] = Math.random() > 0.8 ? 1 : 0;
            }
        }

        this.rows = rows;
        this.cols = cols;
        this.source = source;
        this.target = target;
        this.totalCells = totalCells;
    }

    static async new(cols, rows) {
        return Promise.resolve(new JSUniverse(cols, rows));
    }

    nextGen() {
        const {source, target, swap, rows, cols} = this;
        const [src, tar] = swap ? [target, source] : [source, target];

        for (let row = 1; row < rows; row++) {
            const offset = row * cols;
            const top = (row - 1) * cols;
            const bottom = (row + 1) * cols;

            for (let col = 1; col < cols; col++) {
                const cellOffset = offset + col;
                const bottomOffset = bottom + col;
                const topOffset = top + col;

                const neighbors = src[topOffset - 1] + // Top Left
                    src[topOffset] + // Top Middle
                    src[topOffset + 1] + // Top Right
                    src[cellOffset - 1] + // Left
                    src[cellOffset + 1] + // Right
                    src[bottomOffset - 1] + // Bottom Left
                    src[bottomOffset] + // Bottom Middle
                    src[bottomOffset + 1]; // Bottom Right

                // Console.log(` >>> ${neighbors}`);
                const newState = src[cellOffset] ?

                    // Any live cell with fewer than two live neighbours dies, as if by underpopulation.
                    // Any live cell with two or three live neighbours lives on to the next generation.
                    // Any live cell with more than three live neighbours dies, as if by overpopulation.
                    (neighbors < 4 && neighbors > 1) :

                    // Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
                    neighbors === 3;

                // Save state
                tar[cellOffset] = newState ? 1 : 0;
            }
        }

        this.swap = !swap;
    }

    cells() {
        return this.swap ? this.source : this.target;
    }
}
