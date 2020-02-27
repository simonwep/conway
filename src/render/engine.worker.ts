import {expose}                                 from 'comlink';
import {createUniverse, Universe, UniverseMode} from './modes/universe';

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
    private universe: Universe | null;
    private mode: UniverseMode | null;
    private running: boolean;

    private constructor(canvas: OffscreenCanvas) {
        this.canvas = canvas;
        this.universe = null;
        this.mode = null;
        this.running = false;

        this.ctx = canvas.getContext('2d', {
            antialias: false,
            alpha: false
        }) as OffscreenCanvasRenderingContext2D;
    }

    private get props(): Environment {
        const {width: cw, height: ch} = this.canvas;
        const block = BLOCK_SIZE + BLOCK_MARGIN;

        // Calculate margin, rows and cols
        const width = cw - cw % block;
        const height = ch - ch % block;
        const cols = width / block;
        const rows = height / block;

        return {
            width, height,
            rows, cols,
            block
        };
    };

    public async setMode(mode: UniverseMode): Promise<void> {
        const {ctx, props, running} = this;
        const {width, height, rows, cols} = props;

        if (this.universe) {
            await this.stop();
        }

        // Reset canvas
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);

        // Re-initiate universe
        this.mode = mode;
        this.universe = await createUniverse(mode, rows, cols);

        // Start if it was active
        if (running) {
            this.play();
        }
    }

    public pause(): void {
        this.running = false;
    }

    public async stop(): Promise<void> {
        this.running = false;

        return new Promise<void>(resolve => {
            requestAnimationFrame(() => {

                if (this.universe) {
                    this.universe.free();
                }

                resolve();
            });
        });
    }

    public play(): void {

        // Validate current state
        if (this.running) {
            throw new Error('Already running.');
        } else if (this.universe === null) {
            throw new Error('setMode must be called at least once.');
        }

        this.running = true;
        const {ctx, props, universe} = this;
        const {block} = props;

        const renderLoop = (): void => {

            if (!this.running) {
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
