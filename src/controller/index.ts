import {Remote, transfer, wrap}            from 'comlink';
import {Config, Engine, EngineConstructor} from './engine';
import {panning}                           from './panning';
import {storesync}                         from './storesync';

// Engine instance
export let engine: null | Remote<Engine> = null;

// If engine has been initialized
export let initialized = false;

// GOL Controls
export const controls = {

    async play(): Promise<void> {
        await engine!.play();
    },

    async pause(): Promise<void> {
        await engine!.pause();
    },

    async next(): Promise<void> {
        await engine!.nextGeneration();
    }
};


// Called only once to mount the canvas
export const init = async (): Promise<void> => {

    // Mount worker
    const Engine = wrap<EngineConstructor>(new Worker(
        './engine/index.ts',
        {type: 'module'}
    ));

    const blockSize = 2;
    const blockMargin = 1;

    // Prep offscreenCanvas
    const canvas = document.querySelector('body > canvas') as HTMLCanvasElement;
    const offscreenCanvas = canvas.transferControlToOffscreen();
    const payload = transfer(offscreenCanvas, [offscreenCanvas]);

    // Create engine instance
    const current = engine = await new Engine(
        payload,
        {
            blockSize,
            blockMargin,
            width: window.innerWidth,
            height: window.innerHeight
        } as Config
    );

    // Auto-play
    await current.play();

    // Fire modules
    panning(canvas, current);
    storesync(canvas, current);

    window.addEventListener('resize', (() => {
        let timeout: unknown = 0;

        return () => {
            clearTimeout(timeout as number);
            timeout = setTimeout(async () => {
                await current.updateConfig({
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
                await current.setMode('rust');
                break;
            }
            case  'KeyJ': {
                await current.setMode('js');
                break;
            }
            case 'KeyP': {
                if (await current.isRunning()) {
                    await current.pause();
                } else {
                    await current.play();
                }
            }
        }
    });

    initialized = true;
};
