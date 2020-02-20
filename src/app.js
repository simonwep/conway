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
    const cellCount = rows * cols + rows * 2 + cols * 2;
    let source = new Uint8Array(cellCount);
    let target = new Uint8Array(cellCount);
    let swap = false;

    // Randomize cells
    for (let row = 1; row < rows; row++) {
        const offset = row * cols;

        for (let col = 1; col < cols; col++) {
            source[offset + col] = Math.random() > 0.8 ? 1 : 0;
        }
    }

    // Draw grid
    const nextGen = () => {
        const [src, tar] = swap ? [target, source] : [source, target];

        // Clear rect
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#000';

        for (let row = 1; row < rows; row++) {
            const offset = row * cols;
            const top = (row - 1) * cols;
            const bottom = (row + 1) * cols;

            for (let col = 1; col < cols; col++) {
                const cellOffset = offset + col;
                const bottomOffset = bottom + col;
                const topOffset = top + col;

                const neighbors = src[topOffset - 1] + // TL
                    src[topOffset] + // TM
                    src[topOffset + 1] + // TR
                    src[cellOffset - 1] + // L
                    src[cellOffset + 1] + // R
                    src[bottomOffset - 1] + // BL
                    src[bottomOffset] + // BM
                    src[bottomOffset + 1]; // BR

                // console.log(` >>> ${neighbors}`);
                const newState = src[cellOffset] ?

                    // Any live cell with fewer than two live neighbours dies, as if by underpopulation.
                    // Any live cell with two or three live neighbours lives on to the next generation.
                    // Any live cell with more than three live neighbours dies, as if by overpopulation.
                    (neighbors < 4 && neighbors > 1) :

                    // Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
                    neighbors === 3;

                // Save state
                tar[cellOffset] = newState ? 1 : 0;

                // Draw pixel
                if (newState) {
                    ctx.fillRect(row * BLOCK, col * BLOCK, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        }

        swap = !swap;
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
