import './styles.css';

const BLOCK_SIZE = 2;
const BLOCK_MARGIN = 1;
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d', {
    antialias: false,
    alpha: false
});

const loop = () => {
    const {innerWidth, innerHeight} = window;
    const BLOCK = BLOCK_SIZE + BLOCK_MARGIN;
    let stopped = false;

    // Calculate margin
    const width = innerWidth - innerWidth % BLOCK;
    const height = innerHeight - innerHeight % BLOCK;

    // Resize canvas
    canvas.width = width;
    canvas.height = height;
    const rows = width / BLOCK;
    const cols = height / BLOCK;
    const cellCount = rows * cols;
    let cells = new Uint8Array(cellCount);

    // Randomize cells
    for (let i = 0; i < cells.length; i++) {
        const neighbors = Math.floor(Math.random() * 4);
        cells[i] = (neighbors << 1) + (Math.random() > 0.8 ? 1 : 0);
    }

    // Draw grid
    const nextGen = () => {
        const newCells = new Uint8Array(cellCount);

        // Clear rect
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#000';

        for (let i = 0; i < rows; i++) {
            const offset = i * cols;
            const hasBottom = i < rows - 1;
            const hasTop = offset !== 0;

            for (let j = 0; j < cols; j++) {
                const cellOffset = offset + j;
                const hasLeft = j > 0;
                const hasRight = j + 1 < cols;
                let neighbors = 0;

                // Top row
                if (hasTop) {
                    const topMiddle = cellOffset - cols;
                    neighbors += (cells[topMiddle] & 0b1) // TOP MIDDLE
                        + (hasLeft ? cells[topMiddle - 1] & 0b1 : 0)  // TOP LEFT
                        + (hasRight ? cells[topMiddle + 1] & 0b1 : 0); // TOP RIGHT
                }

                // Left & Right
                neighbors += (hasLeft ? cells[cellOffset - 1] & 0b1 : 0) // LEFT
                    + (hasRight ? cells[cellOffset + 1] & 0b1 : 0); // RIGHT

                // Bottom row
                if (hasBottom) {
                    const bottomMiddle = cellOffset + cols;
                    neighbors += (cells[bottomMiddle] & 0b1) // BOTTOM MIDDLE
                        + (hasLeft ? cells[bottomMiddle - 1] & 0b1 : 0)  // BOTTOM LEFT
                        + (hasRight ? cells[bottomMiddle + 1] & 0b1 : 0); // BOTTOM RIGHT
                }

                const newState = (cells[cellOffset] & 0b1) === 1 ?

                    // Any live cell with fewer than two live neighbours dies, as if by underpopulation.
                    // Any live cell with two or three live neighbours lives on to the next generation.
                    // Any live cell with more than three live neighbours dies, as if by overpopulation.
                    (neighbors < 4 && neighbors > 1) :

                    // Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
                    neighbors === 3;

                // Save state
                newCells[cellOffset] = (neighbors << 1) + newState;

                // Draw pixel
                if (newState) {
                    ctx.fillRect(i * BLOCK, j * BLOCK, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        }

        cells = newCells;
        if (!stopped) {
            requestAnimationFrame(nextGen);
        }
    };

    requestAnimationFrame(nextGen);
    return () => stopped = true;
};

let stop = loop();
window.addEventListener('resize', () => {
    stop();
    stop = loop();
});


// Import('../crate/pkg').then(module => {
//     Console.log('[WASM] Crate loaded...');
//     Console.log(canvas);
//
//
//
//
//
//
//
// });
