import {RustUniverse} from './modes/rust';
import './styles.css';
import {JSUniverse}   from './modes/javascript';

const BLOCK_SIZE = 1;
const BLOCK_MARGIN = 1;
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d', {
    antialias: false,
    alpha: false
});

const resizeCanvas = () => {
    const {innerWidth, innerHeight} = window;
    const block = BLOCK_SIZE + BLOCK_MARGIN;

    // Calculate margin
    const width = innerWidth - innerWidth % block;
    const height = innerHeight - innerHeight % block;

    // Resize canvas
    canvas.width = width;
    canvas.height = height;
    const rows = width / block;
    const cols = height / block;
    return {width, height, rows, cols, block};
};

const start = async (mode = RustUniverse) => {
    const {width, height, rows, cols, block} = resizeCanvas();

    // Construct the universe, and get its width and height.
    const universe = await mode.new(cols, rows);
    let stopped = false;

    const renderLoop = () => {
        universe.nextGen();
        const cells = universe.cells();

        // Clear rect
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#000';

        ctx.beginPath();
        for (let row = 1; row < rows; row++) {
            const offset = row * cols;

            for (let col = 1; col < cols; col++) {
                if (cells[offset + col] === 1) {
                    ctx.rect(row * block, col * block, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        }

        ctx.fill();

        if (!stopped) {
            requestAnimationFrame(renderLoop);
        }
    };

    renderLoop();
    return () => stopped = true;
};

(async () => {
    let stop = await start();

    window.addEventListener('keyup', async e => {

        if (stop) {
            stop();
        }

        switch (e.code) {
            case 'KeyR' : {
                stop = await start(RustUniverse);
                break;
            }
            case  'KeyJ': {
                stop = await start(JSUniverse);
                break;
            }
        }
    });
})();

