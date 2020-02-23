import {RustUniverse} from './modes/rust';
import './styles.css';
import {JSUniverse}   from './modes/javascript';

const BLOCK_SIZE = 2;
const BLOCK_MARGIN = 0;
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d', {
    antialias: false,
    alpha: true
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
    const {rows, cols, block} = resizeCanvas();

    // Construct the universe, and get its width and height.
    const universe = await mode.new(cols, rows);
    let stopped = false;

    ctx.fillStyle = '#000';
    const renderLoop = () => {
        universe.nextGen();
        const cells = universe.cells();

        for (let i = 0; i < cells.length; i += 3) {
            const col = cells[i] * block;
            const row = cells[i + 1] * block;
            const state = cells[i + 2];

            if (state) {
                ctx.fillRect(col, row, BLOCK_SIZE, BLOCK_SIZE);
            } else {
                ctx.clearRect(col, row, BLOCK_SIZE, BLOCK_SIZE);
            }
        }

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

