import {transfer, wrap}            from 'comlink';
import {h, render}                 from 'preact';
import {App}                       from './app/App';
import './styles/_global.scss';
import {Config, EngineConstructor} from './worker/engine';

render(
    <App/>,
    document.getElementById('app') as HTMLElement
);

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

    // TODO: Bigger sizes are broken
    const blockSize = 1;
    const blockMargin = 1;

    const instance = await new Engine(
        payload,
        {
            blockSize,
            blockMargin,
            width: window.innerWidth,
            height: window.innerHeight
        } as Config
    );

    await instance.play();

    let scale = 1;
    const zoomFactor = 2;
    let x = 0;
    let y = 0;

    canvas.addEventListener('wheel', async e => {
        const delta = (e.deltaY < 0 ? zoomFactor : 1 / zoomFactor);

        if (scale === 1 && scale * delta < 1) {
            return;
        }

        scale *= delta;
        x = Math.round(e.pageX - (e.pageX - x) * delta);
        y = Math.round(e.pageY - (e.pageY - y) * delta);

        // Lock fullscreen
        if (scale <= 1) {
            x = 0;
            y = 0;
            scale = 1;
        }

        // TODO: Fix blurry pixels
        await instance.transform({
            scale, x, y
        });
    });


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

