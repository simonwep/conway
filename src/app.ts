import {transfer, wrap} from 'comlink';
import './styles.css';

const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const {innerWidth, innerHeight} = window;
const BLOCK_SIZE = 1;
const BLOCK_MARGIN = 1;
const block = BLOCK_SIZE + BLOCK_MARGIN;

// Calculate margin
const width = innerWidth - innerWidth % block;
const height = innerHeight - innerHeight % block;

// Resize canvas
canvas.width = width;
canvas.height = height;

/* eslint-disable @typescript-eslint/no-misused-promises */
(async (): Promise<void> => {

    const worker = new Worker(
        'engine.worker.js'
    );

    const Subby = wrap(worker);
    const offscreenCanvas = canvas.transferControlToOffscreen();
    const payload = transfer(offscreenCanvas, [offscreenCanvas]);

    const instance = await new Subby(payload);

    await instance.setMode('rust');
    await instance.play();

    window.addEventListener('keyup', async e => {

        switch (e.code) {
            case 'KeyR' : {
                await instance.setMode('rust');
                break;
            }
            case  'KeyJ': {
                await instance.setMode('js');
                break;
            }
        }
    });
})();

