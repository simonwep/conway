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
    const cols = width / block;
    const rows = height / block;
    return {width, height, rows, cols, block};
};

const start = async (mode = RustUniverse) => {
    const {width, height, rows, cols, block} = resizeCanvas();

    // Construct the universe, and get its width and height.
    const universe = await mode.new(rows, cols);
    let stopped = false;

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    const renderLoop = () => {

        if (stopped) {
            universe.free();
            return;
        }

        // Draw killed cells
        ctx.beginPath();
        const killed = universe.killed();
        for (let i = 0; i < killed.length; i += 2) {
            const row = killed[i] * block;
            const col = killed[i + 1] * block;
            ctx.rect(col, row, BLOCK_SIZE, BLOCK_SIZE);
        }

        ctx.fillStyle = '#fff';
        ctx.fill();

        // Draw living cells
        ctx.beginPath();
        const resurrected = universe.resurrected();
        for (let i = 0; i < resurrected.length; i += 2) {
            const row = resurrected[i] * block;
            const col = resurrected[i + 1] * block;
            ctx.rect(col, row, BLOCK_SIZE, BLOCK_SIZE);
        }

        ctx.fillStyle = '#000';
        ctx.fill();

        universe.nextGen();
        requestAnimationFrame(renderLoop);
    };

    requestAnimationFrame(renderLoop);
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

