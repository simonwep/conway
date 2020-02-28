import {transfer, wrap}                 from 'comlink';
import './style/index.css';
import {EngineConstructor, Environment} from './worker/engine';

const canvas = document.querySelector('canvas') as HTMLCanvasElement;

/* eslint-disable @typescript-eslint/no-misused-promises */
(async (): Promise<void> => {

    const worker = new Worker(
        './worker/engine/index.ts',
        {type: 'module'}
    );

    const Engine = wrap<EngineConstructor>(worker);
    const offscreenCanvas = canvas.transferControlToOffscreen();
    const payload = transfer(offscreenCanvas, [offscreenCanvas]);

    const blockSize = 1;
    const blockMargin = 0;

    const instance = await new Engine(
        payload,
        {
            blockSize,
            blockMargin,
            width: window.innerWidth,
            height: window.innerHeight
        } as Environment
    );

    await instance.play();

    window.addEventListener('resize', (() => {
        let timeout: unknown = 0;

        return () => {
            clearTimeout(timeout as number);
            timeout = setTimeout(async () => {
                await instance.updateConfig({
                    blockSize,
                    blockMargin,
                    width: window.innerWidth,
                    height: window.innerHeight
                });
            }, 1000);
        };
    })());

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
            case 'KeyP': {
                if (await instance.isRunning()) {
                    await instance.pause();
                } else {
                    await instance.play();
                }
            }
        }
    });
})();

