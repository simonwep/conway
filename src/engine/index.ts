import {Actor, ActorInstance, transfer} from '../lib/actor/actor.main';
import {life, shortcuts}                from '../store';
import {draw}                           from './plugins/draw';
import {panning}                        from './plugins/panning';
import {resize}                         from './plugins/resize';
import {Config, Engine}                 from './worker/main';

// Engine instance
export let engine: ActorInstance<Engine>;

// Async way to retrieve the engine as soon as possible
const engineMountListeners: Array<(engine: ActorInstance<Engine>) => void> = [];
export const getEngine = async (): Promise<typeof engine> => {
    return new Promise(resolve => {
        engineMountListeners.push(resolve);
    });
};

// Called only once to mount the canvas
export const init = async (): Promise<void> => {

    // Grab canvases
    const overlayCanvas = document.getElementById('draw-overlay') as HTMLCanvasElement;
    const mainCanvas = document.getElementById('main-canvas') as HTMLCanvasElement;

    // Prep offscreenCanvas
    const offscreenCanvas = mainCanvas.transferControlToOffscreen();

    // Mount worker
    const current = engine = await new Actor(new Worker(
        './worker/main.ts',
        {type: 'module'}
    )).create<Engine>('Engine', transfer(offscreenCanvas), {
        cellSize: 2,
        width: window.innerWidth,
        height: window.innerHeight
    } as Config);

    // Link to store
    life.setEngine(current);

    // Auto-play
    await current.call('play');

    // Launch modules
    resize(mainCanvas, current);

    // Drawing requires up-to-date data from how the canvas is transformed / scaled
    draw(
        panning(mainCanvas, current),
        overlayCanvas,
        current
    );

    // Fire awaiting requests
    for (const req of engineMountListeners) {
        req(current);
    }

    // Register keyboard-shortcuts
    shortcuts.registerAll([
        {
            name: 'play-pause',
            description: 'Pause / Resume Simulation',
            binding: ['Space'],
            callbacks: [(): void => life.toggle()]
        },
        {
            name: 'increase-cell-size',
            description: 'Increase the cell-size',
            binding: ['Control', '+'],
            callbacks: [(): void => life.increaseCellSize()]
        },
        {
            name: 'decrease-cell-size',
            description: 'Decrease the cell-size',
            binding: ['Control', '-'],
            callbacks: [(): void => life.decreaseCellSize()]
        }
    ]);
};
