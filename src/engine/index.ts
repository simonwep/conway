import {Actor, ActorInstance, transfer} from '../actor/actor.main';
import {life}                           from '../store';
import {panning}                        from './plugins/panning';
import {resize}                         from './plugins/resize';
import {Config, Engine}                 from './worker/main';

// Engine instance
export let engine: ActorInstance;

// Async way to retrieve the engine as soon as possible
const engineMountListeners: Array<(engine: ActorInstance) => void> = [];
export const getEngine = async (): Promise<typeof engine> => {
    return new Promise(resolve => {
        engineMountListeners.push(resolve);
    });
};

// Called only once to mount the canvas
export const init = async (): Promise<void> => {

    const blockSize = 1;

    // Prep offscreenCanvas
    const canvas = document.querySelector('body > canvas') as HTMLCanvasElement;
    const offscreenCanvas = canvas.transferControlToOffscreen();

    // Mount worker
    const current = engine = await new Actor(new Worker(
        './worker/main.ts',
        {type: 'module'}
    )).create('Engine', transfer(offscreenCanvas), {
        blockSize,
        width: window.innerWidth,
        height: window.innerHeight
    } as Config);

    // Link to store
    life.setEngine(current);

    // Auto-play
    await current.call('play');

    // Launch modules
    panning(canvas, current);
    resize(canvas, current);

    // Fire awaiting requests
    for (const req of engineMountListeners) {
        req(current);
    }
};
