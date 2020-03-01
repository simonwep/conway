import {transfer, wrap}            from 'comlink';
import {h, render}                 from 'preact';
import {App}                       from './app/App';
import './styles/_global.scss';
import {life}                      from './store';
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

    const blockSize = 2;
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
    let x = 0, y = 0;
    canvas.addEventListener('wheel', async e => {
        const delta = (e.deltaY < 0 ? zoomFactor : 1 / zoomFactor);

        if (scale === 1 && scale * delta < 1) {
            return;
        }

        scale *= delta;
        x = Math.round(e.pageX - (e.pageX - x) * delta);
        y = Math.round(e.pageY - (e.pageY - y) * delta);

        // Lock fullscreen
        if (scale == 1) {
            canvas.style.cursor = 'default';
            x = 0;
            y = 0;
        } else {
            canvas.style.cursor = 'grab';
        }

        await instance.transform({
            scale, x, y
        });
    });

    let dragging = false;
    let sx = 0, sy = 0;
    canvas.addEventListener('mousemove', async e => {
        if (dragging && scale > 1) {
            x = Math.round(x + (e.pageX - sx));
            y = Math.round(y + (e.pageY - sy));

            sx = e.pageX;
            sy = e.pageY;

            // TODO: Lock on edges
            await instance.transform({
                scale, x, y
            });
        }
    });

    canvas.addEventListener('mousedown', e => {
        dragging = true;
        sx = e.pageX;
        sy = e.pageY;
        console.log('set');
    });

    canvas.addEventListener('mouseup', () => dragging = false);

    setInterval(async() => {
        life.fps = await instance.getFrameRate();
        life.generation = await instance.getGeneration();
    }, 1000);

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

