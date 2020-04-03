import {deserialize}                    from 'nason';
import {Actor, ActorInstance, transfer} from '../lib/actor/actor.main';
import {on}                             from '../lib/events';
import {life, shortcuts}                from '../store';
import {Draw}                           from './plugins/draw';
import {Panning}                        from './plugins/panning';
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

    // Drawing requires up-to-date data from how the canvas is transformed / scaled
    const panning = new Panning(mainCanvas, current, shortcuts);
    new Draw(panning, overlayCanvas, mainCanvas, current, shortcuts, life);

    // Fire awaiting requests
    for (const req of engineMountListeners) {
        req(current);
    }

    // Listen for dropped files
    /* eslint-disable no-console */
    on(window, ['dragover', 'drop'], (ev: DragEvent) => {
        if (ev.type === 'drop' && ev.dataTransfer) {
            const {files} = ev.dataTransfer;

            if (files.length > 0) {
                files[0].arrayBuffer().then(value => {
                    try {
                        const data = deserialize(new Uint8Array(value)) as any;

                        // I assume the file is correct
                        life.setCellSize(data.cellSize);
                        engine.call('load', data.cells, data.cols);

                        if (data.generation !== null) {
                            life.setGenerationCounter(data.generation);
                        }

                        if (data.fpsLock !== null) {
                            life.setFPSLimitation(data.fpsLock);
                        }

                        if (data.rules) {
                            life.setResurrectRules(data.rules.resurrect);
                            life.setSurviveRules(data.rules.survive);
                        }

                        life.pause();
                    } catch (e) {
                        console.warn('[IMPORT FAILED]', e);
                    }
                });
            }
        }

        ev.preventDefault();
    });

    // Register keyboard-shortcuts
    shortcuts.register([
        {
            name: 'play-pause',
            description: 'Pause / Resume Simulation',
            binding: ['SPACE'],
            callbacks: [(): void => life.toggle()]
        },
        {
            name: 'next-generation',
            description: 'Generate next generation',
            binding: ['ARROW RIGHT'],
            callbacks: [(): void => life.nextGeneration()]
        },
        {
            name: 'increase-cell-size',
            description: 'Increase the cell-size',
            binding: ['CONTROL', '+'],
            callbacks: [(): void => life.increaseCellSize()]
        },
        {
            name: 'decrease-cell-size',
            description: 'Decrease the cell-size',
            binding: ['CONTROL', '-'],
            callbacks: [(): void => life.decreaseCellSize()]
        }
    ]);
};
