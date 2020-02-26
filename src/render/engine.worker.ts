import {expose}                       from 'comlink';
import {createUniverse, UniverseMode} from './modes/universe';

export type EngineRunningState = 'paused' | 'running';

export type Environment = {
    width: number;
    height: number;
    rows: number;
    cols: number;
    block: number;
};


const BLOCK_SIZE = 1;
const BLOCK_MARGIN = 1;

export class Engine {

    private readonly canvas: OffscreenCanvas;
    private readonly ctx: OffscreenCanvasRenderingContext2D;
    private state: EngineRunningState = 'paused';
    private mode: UniverseMode = 'js';
    private props: Environment;

    constructor(canvas: OffscreenCanvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', {
            antialias: false,
            alpha: false
        }) as OffscreenCanvasRenderingContext2D;

        this.recalculateEnvironment();
    }

    public recalculateEnvironment(): void {
        const {width: cw, height: ch} = this.canvas;
        const block = BLOCK_SIZE + BLOCK_MARGIN;

        // Calculate margin, rows and cols
        const width = cw - cw % block;
        const height = ch - ch % block;
        const cols = width / block;
        const rows = height / block;

        this.props = {
            width, height,
            rows, cols,
            block
        };
    };

    public pause(): void {
        this.state = 'paused';
    }

    public async play(): Promise<void> {

        // Validate current state
        if (this.state === 'running') {
            throw new Error('Already running.');
        }

        this.state = 'running';
        const {ctx, props, mode} = this;
        const {width, height, rows, cols, block} = props;

        // Construct the universe, and get its width and height.
        const universe = await createUniverse(mode, rows, cols);

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);

        const renderLoop = (): void => {

            // TODO: Only pause, not kill
            if (this.state === 'paused') {
                universe.free();
                return;
            }

            // Draw killed cells
            ctx.beginPath();
            const killed = universe.killed();
            for (let i = 0; i < killed.length; i += 2) {
                const row = killed[i] * block;
                const col = killed[i + 1] * block;
                ctx.rect(col, row, BLOCK_SIZE, BLOCK_SIZE);
            }

            ctx.fillStyle = '#fff';
            ctx.fill();

            // Draw living cells
            ctx.beginPath();
            const resurrected = universe.resurrected();
            for (let i = 0; i < resurrected.length; i += 2) {
                const row = resurrected[i] * block;
                const col = resurrected[i + 1] * block;
                ctx.rect(col, row, BLOCK_SIZE, BLOCK_SIZE);
            }

            ctx.fillStyle = '#000';
            ctx.fill();

            universe.nextGen();
            requestAnimationFrame(renderLoop);
        };

        requestAnimationFrame(renderLoop);
    }
}

expose(Engine);
