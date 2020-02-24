import {Universe} from './universe';

export class JSUniverse implements Universe {

    cols = 0;
    rows = 0;
    source: Uint8Array = null;
    target: Uint8Array = null;
    killedCells: Uint32Array = null;
    resurrectedCells: Uint32Array = null;
    killedCellsAmount = 0;
    resurrectedCellsAmount = 0;
    swap = false;

    constructor(rows: number, cols: number) {

        cols += 2;
        rows += 2;

        const totalCells = cols * rows;
        const source = new Uint8Array(totalCells);
        const target = new Uint8Array(totalCells);

        this.killedCells = new Uint32Array(totalCells * 2 * 4);
        this.resurrectedCells = new Uint32Array(totalCells * 2 * 4);

        for (let row = 1; row < rows - 1; row++) {
            const offset = row * cols;

            for (let col = 1; col < cols - 1; col++) {
                if (Math.random() > 0.45) {
                    source[offset + col] = 1;
                    this.resurrectedCells[this.resurrectedCellsAmount++] = row - 1;
                    this.resurrectedCells[this.resurrectedCellsAmount++] = col - 1;
                }
            }
        }

        this.rows = rows;
        this.cols = cols;
        this.source = source;
        this.target = target;
    }

    static async new(rows: number, cols: number): Promise<JSUniverse> {
        return Promise.resolve(new JSUniverse(rows, cols));
    }

    nextGen(): void {
        const {resurrectedCells, killedCells, source, target, swap, rows, cols} = this;
        const [src, tar] = swap ? [target, source] : [source, target];
        this.resurrectedCellsAmount = 0;
        this.killedCellsAmount = 0;
        this.swap = !swap;

        for (let row = 1; row < (rows - 1); row++) {
            const top = (row - 1) * cols + 1;
            const middle = row * cols + 1;
            const bottom = (row + 1) * cols + 1;

            let mask =
                (src[top - 1] ? 32 : 0) + (src[top] ? 4 : 0) +
                (src[middle - 1] ? 16 : 0) + (src[middle] ? 2 : 0) +
                (src[bottom - 1] ? 8 : 0) + (src[bottom] ? 1 : 0);

            for (let col = 1; col < (cols - 1); col++) {

                mask = ((mask << 3) & 0b111111111) +
                    (src[top + col] ? 4 : 0) +
                    (src[middle + col] ? 2 : 0) +
                    (src[bottom + col] ? 1 : 0);

                const neighbors = (mask & 0b1) +
                    (mask >> 1 & 0b1) +
                    (mask >> 2 & 0b1) +
                    (mask >> 3 & 0b1) +
                    (mask >> 5 & 0b1) +
                    (mask >> 6 & 0b1) +
                    (mask >> 7 & 0b1) +
                    (mask >> 8 & 0b1) +
                    (mask >> 9 & 0b1);

                const cellIndex = middle + col - 1;
                const cell = src[cellIndex];
                const next = (
                    cell ?
                        neighbors < 4 && neighbors > 1 :
                        neighbors === 3
                ) ? 1 : 0;

                tar[cellIndex] = next;

                if (cell !== next) {
                    if (next) {
                        resurrectedCells[this.resurrectedCellsAmount++] = row - 1;
                        resurrectedCells[this.resurrectedCellsAmount++] = col - 1;
                    } else {
                        killedCells[this.killedCellsAmount++] = row - 1;
                        killedCells[this.killedCellsAmount++] = col - 1;
                    }
                }
            }
        }
    }

    resurrected(): Uint32Array {
        return new Uint32Array(
            this.resurrectedCells.buffer,
            0,
            this.resurrectedCellsAmount
        );
    }

    killed(): Uint32Array {
        return new Uint32Array(
            this.killedCells.buffer,
            0,
            this.killedCellsAmount
        );
    }

    /* eslint-disable @typescript-eslint/no-empty-function */
    /* eslint-disable no-empty-function */
    free(): void {
    }
}


