import {Remote, transfer, wrap}                  from 'comlink';
import {life}                                    from '../store';
import {panning}                                 from './plugins/panning';
import {resize}                                  from './plugins/resize';
import {Config, EngineConstructor, EngineWorker} from './worker/main';

// Engine instance
export let engine: Remote<EngineWorker>;

// Async way to retrieve the engine as soon as possible
const engineMountListeners: Array<() => void> = [];
export const getEngine = async (): Promise<typeof engine> => {
    if (engine) {
        return engine;
    }

    return new Promise(resolve => {
        engineMountListeners.push(() => {
            resolve(engine);
        });
    });
};

// Called only once to mount the canvas
export const init = async (): Promise<void> => {

    // Mount worker
    const Engine = wrap<EngineConstructor>(new Worker(
        './worker/main.ts',
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
    life.setEngine(current);

    // Auto-play
    await current.mount();
    await current.play();

    // Launch modules
    panning(canvas, current);
    resize(canvas, current);

    // Fire awaiting requests
    for (const req of engineMountListeners) {
        req();
    }
};
