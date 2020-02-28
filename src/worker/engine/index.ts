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

export interface EngineConstructor {
    new(canvas: OffscreenCanvas, config: Environment): Engine;
}

export class Engine {

    // Amount of single frames to stabilize the fps
    public static readonly FPS_BUFFER = 16;
    public static readonly STANDARD_MODE: UniverseMode = 'js';

    private readonly fpsBuffer: Uint32Array;
    private readonly canvas: OffscreenCanvas;
    private readonly ctx: OffscreenCanvasRenderingContext2D;
    private activeAnimationFrame: number | null;
    private universe: Universe;
    private mode: UniverseMode;
    private env: Environment;
    private running: boolean;
    private generation: number;

    private constructor(
        canvas: OffscreenCanvas,
        config: Environment
    ) {
        this.canvas = canvas;
        this.fpsBuffer = new Uint32Array(Engine.FPS_BUFFER);
        this.mode = Engine.STANDARD_MODE;
        this.activeAnimationFrame = null;
        this.generation = 0;
        this.env = Engine.configToEnv(config);

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

    private static configToEnv(conf: Config): Environment {
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

        // Reset generation counter
        this.generation = 0;

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
            this.play();
        }
    }

    public async pause(): Promise<void> {
        this.running = false;

        // Cancel next frame
        if (this.activeAnimationFrame !== null) {
            cancelAnimationFrame(this.activeAnimationFrame);
        }
    }

    public async stop(): Promise<void> {
        await this.pause();

        // Free memory
        if (this.universe) {
            this.universe.free();
        }
    }

    public async play(): Promise<void> {

        // Validate current state
        if (this.running) {
            throw new Error('Already running.');
        } else if (this.universe === null) {
            throw new Error('setMode must be called at least once.');
        }

        this.running = true;
        const {ctx, universe, env, fpsBuffer} = this;
        const {block, blockSize} = env;

        // Reset buffer
        for (let i = 0; i < fpsBuffer.length; i++) {
            fpsBuffer[i] = 0;
        }

        let fpsBufferIndex = 0;
        const renderLoop = (): void => {
            const start = performance.now();
            this.generation++;

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

            // Save time this frame took
            const end = performance.now();
            fpsBuffer[fpsBufferIndex] = ~~(end - start);

            fpsBufferIndex++;
            if (fpsBufferIndex > Engine.FPS_BUFFER) {
                fpsBufferIndex = 0;
            }

            this.activeAnimationFrame = requestAnimationFrame(renderLoop);
        };

        requestAnimationFrame(renderLoop);
    }

    public async isRunning(): Promise<boolean> {
        return this.running;
    }

    public async getMode(): Promise<UniverseMode> {
        return this.mode;
    }

    public async getGeneration(): Promise<number> {
        return this.generation;
    }

    public async getFrameRate(): Promise<number> {
        let total = 0;

        for (let i = 0; i < Engine.FPS_BUFFER; i++) {
            total += this.fpsBuffer[i];
        }

        return ~~(1000 / (total / Engine.FPS_BUFFER));
    }

    public async updateConfig(config: Config): Promise<void> {

        this.env = Engine.configToEnv(config);
        const {env, canvas} = this;
        const {width, height} = env;

        canvas.width = width;
        canvas.height = height;

        await this.setMode(this.mode);
    }
}

expose(Engine);
