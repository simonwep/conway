import {expose}                 from 'comlink';
import {JSUniverse}             from './modes/javascript';
import {RustUniverse}           from './modes/rust';
import {Universe, UniverseMode} from './modes/universe';

export type Config = {
    width: number;
    height: number;
    blockSize: number;
    blockMargin: number;
};

export type Environment = {
    width: number;
    height: number;
    cols: number;
    rows: number;
    block: number;
    blockSize: number;
    blockMargin: number;
};

export class Engine {

    public static readonly STANDARD_MODE: UniverseMode = 'js';

    private readonly canvas: OffscreenCanvas;
    private readonly ctx: OffscreenCanvasRenderingContext2D;
    private activeAnimationFrame: number | null;
    private universe: Universe;
    private mode: UniverseMode;
    private env: Environment;
    private running: boolean;

    private constructor(
        canvas: OffscreenCanvas,
        config: Config
    ) {
        this.canvas = canvas;
        this.mode = Engine.STANDARD_MODE;
        this.activeAnimationFrame = null;
        this.env = this.configToEnv(config);

        this.running = false;
        this.ctx = canvas.getContext('2d', {
            antialias: false,
            alpha: false
        }) as OffscreenCanvasRenderingContext2D;

        // Reset canvas
        const {width, height, rows, cols} = this.env;
        canvas.width = width;
        canvas.height = height;

        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, width, height);
        this.universe = new JSUniverse(rows, cols);
    }

    private configToEnv(conf: Config): Environment {
        const {width, height, blockMargin, blockSize} = conf;
        const block = blockMargin + blockSize;

        // Recalculate grid and canvas dimensions
        const realWidth = width - width % block;
        const realHeight = height - height % block;
        const cols = realWidth / blockSize;
        const rows = realHeight / blockSize;

        return {
            width: realWidth,
            height: realHeight,
            block: blockSize + blockMargin,
            blockMargin,
            blockSize,
            rows,
            cols
        };
    }

    public async setMode(mode: UniverseMode): Promise<void> {
        const {env, ctx, running} = this;
        const {cols, rows, width, height} = env;

        if (this.universe) {
            this.stop();
        }

        // Reset canvas
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);

        // Re-initiate universe
        this.mode = mode;

        switch (mode) {
            case 'rust': {
                this.universe = await RustUniverse.new(rows, cols);
                break;
            }
            case 'js': {
                this.universe = JSUniverse.new(rows, cols);
                break;
            }
            default: {
                throw new Error(`Unknown mode: ${mode}`);
            }
        }

        // Restart if it was running
        if (running) {
            requestAnimationFrame(() => {
                this.play();
            });
        }
    }

    public pause(): void {
        this.running = false;
    }

    public stop(): void {
        this.pause();

        // Free memory
        if (this.universe) {
            this.universe.free();
        }
    }

    public play(): void {

        // Validate current state
        if (this.running) {
            throw new Error('Already running.');
        } else if (this.universe === null) {
            throw new Error('setMode must be called at least once.');
        }

        this.running = true;
        const {ctx, universe, env} = this;
        const {block, blockSize} = env;

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
                ctx.rect(col, row, blockSize, blockSize);
            }

            ctx.fillStyle = '#fff';
            ctx.fill();

            // Draw living cells
            ctx.beginPath();
            const resurrected = universe.resurrected();
            for (let i = 0; i < resurrected.length; i += 2) {
                const row = resurrected[i] * block;
                const col = resurrected[i + 1] * block;
                ctx.rect(col, row, blockSize, blockSize);
            }

            ctx.fillStyle = '#000';
            ctx.fill();

            universe.nextGen();
            requestAnimationFrame(renderLoop);
        };

        requestAnimationFrame(renderLoop);
    }

    public isRunning(): boolean {
        return this.running;
    }

    public getMode(): UniverseMode {
        return this.mode;
    }

    public async updateConfig(config: Config): Promise<void> {

        this.env = this.configToEnv(config);
        const {env, canvas} = this;
        const {width, height} = env;

        canvas.width = width;
        canvas.height = height;

        console.log(env);
        await this.setMode(this.mode);
    }
}

expose(Engine);
