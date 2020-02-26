import {transfer, wrap} from 'comlink';
import EngineWorker     from './render/engine.worker';
import './styles.css';

const canvas = document.querySelector('canvas');
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

    const worker = EngineWorker();
    const Subby = wrap(worker);


    const offscreenCanvas = canvas.transferControlToOffscreen();
    const payload = transfer(offscreenCanvas, [offscreenCanvas]);

    const instance = await new Subby(payload);

    await instance.play();

    // window.addEventListener('keyup', async e => {
    //
    //     if (stop) {
    //         stop();
    //     }
    //
    //     switch (e.code) {
    //         case 'KeyR' : {
    //            await start('rust');
    //             break;
    //         }
    //         case  'KeyJ': {
    //             await start('js');
    //             break;
    //         }
    //     }
    // });
})();

