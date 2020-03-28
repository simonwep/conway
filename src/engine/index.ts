import {Actor, ActorInstance, transfer} from '../lib/actor/actor.main';
import {BinaryMap, Types}               from '../lib/bin-loader/BinaryMap';
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
    const panning = new Panning(mainCanvas, current);
    new Draw(panning, overlayCanvas, mainCanvas, current);

    // Fire awaiting requests
    for (const req of engineMountListeners) {
        req(current);
    }

    // Listen for dropped files
    on(window, ['dragover', 'drop'], (ev: DragEvent) => {

        if (ev.type === 'drop' && ev.dataTransfer) {
            const {files} = ev.dataTransfer;

            if (files.length > 0) {
                files[0].arrayBuffer().then(value => {
                    const map = BinaryMap.decode(
                        new Uint8Array(value)
                    );

                    const cellSize = map.getDecoded('cell-size', Types.Number);
                    const data = map.getDecoded('cells', Types.Uint8Array);

                    if (cellSize !== null) {
                        life.setCellSize(cellSize);
                    }

                    if (data !== null) {
                        engine.call('loadStateUnsafe', data);
                    }
                });
            }
        }

        ev.preventDefault();
    });

    // Register keyboard-shortcuts
    shortcuts.registerAll([
        {
            name: 'play-pause',
            description: 'Pause / Resume Simulation',
            binding: ['Space'],
            callbacks: [(): void => life.toggle()]
        },
        {
            name: 'next-generation',
            description: 'Generate next generation',
            binding: ['Arrow Right'],
            callbacks: [(): void => life.nextGeneration()]
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
