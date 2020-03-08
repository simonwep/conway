import {Remote, transfer, wrap}                  from 'comlink';
import {life}                                    from '../store';
import {Config, EngineConstructor, EngineWorker} from './engine.worker';
import {panning}                                 from './panning';

// Engine instance
export let engine: Remote<EngineWorker>;

// If engine has been initialized
export let initialized = false;

// Called only once to mount the canvas
export const init = async (): Promise<void> => {

    // Mount worker
    // TODO: There's a memory-leak somewhere
    const Engine = wrap<EngineConstructor>(new Worker(
        './engine.worker.ts',
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

    // Link to store
    life.setSource(current);

    // Auto-play
    await current.mount();
    await current.play();

    // Launch modules
    panning(canvas, current);

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

    initialized = true;
};
