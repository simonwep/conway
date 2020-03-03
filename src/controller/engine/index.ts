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

export type Transformation = {
    scale: number;
    x: number;
    y: number;
};

export interface EngineConstructor {
    new(canvas: OffscreenCanvas, config: Config): Engine;
}

export class Engine {

    // Amount of single frames to stabilize the fps
    public static readonly FPS_BUFFER = 16;
    public static readonly STANDARD_MODE: UniverseMode = 'js';

    // Buffer of the last N frames, used to smooth the current fps.
    private readonly fpsBuffer: Uint32Array = new Uint32Array(Engine.FPS_BUFFER);

    /**
     * Two canvas are used to draw the scene, the first one is purely
     * to draw living and dead cells, the other one is used to transform
     * it (in case the user zooms in).
     */
    private readonly shadowCanvas: OffscreenCanvas;
    private readonly shadowCtx: OffscreenCanvasRenderingContext2D;
    private readonly canvas: OffscreenCanvas;
    private readonly ctx: OffscreenCanvasRenderingContext2D;

    // Currently requested frame.
    private activeAnimationFrame: number | null = null;

    // Current universe and its mode.
    private universe: Universe;
    private mode: UniverseMode = Engine.STANDARD_MODE;

    // env-data such as screen size, size of block etc.
    private env: Environment;

    // If simulation is running.
    private running = false;

    // Current generation.
    private generation = 0;

    /**
     * Will be set to true if the canvas has been moved / dragged / zoomed.
     * If true the current screen will get cleared and re-painted, otherwise there
     * would be fragments from the previous frame.
     */
    private moved = false;

    private constructor(
        canvas: OffscreenCanvas,
        config: Config
    ) {

        // Convert config to env-properties
        this.env = Engine.configToEnv(config);

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', {
            antialias: false,
            alpha: false
        }) as OffscreenCanvasRenderingContext2D;

        // Reset canvas
        const {width, height, rows, cols} = this.env;
        canvas.width = width;
        canvas.height = height;

        // We're drawing the shadowCanvas with this context,
        // using image-smoothing would blur pixels.
        this.ctx.imageSmoothingEnabled = false;

        // Create shadow canvas
        this.shadowCanvas = new OffscreenCanvas(width, height);
        this.shadowCtx = this.shadowCanvas.getContext('2d', {
            antialias: false,
            alpha: false
        }) as OffscreenCanvasRenderingContext2D;

        // Clear canvas and initialize js-universe
        this.shadowCtx.fillStyle = '#fff';
        this.shadowCtx.fillRect(0, 0, width, height);
        this.universe = new JSUniverse(rows, cols);
    }

    private static configToEnv(conf: Config): Environment {
        const {width, height, blockMargin, blockSize} = conf;
        const block = blockMargin + blockSize;

        // Recalculate grid and canvas dimensions
        const realWidth = width - width % block;
        const realHeight = height - height % block;
        const cols = realWidth / block;
        const rows = realHeight / block;

        return {
            width: realWidth,
            height: realHeight,
            block,
            blockMargin,
            blockSize,
            rows,
            cols
        };
    }

    public async setMode(mode: UniverseMode): Promise<void> {
        const {env, shadowCtx, running} = this;
        const {cols, rows, width, height} = env;

        if (this.universe) {
            this.stop();
        }

        // Reset canvas
        shadowCtx.fillStyle = '#fff';
        shadowCtx.fillRect(0, 0, width, height);

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
        const {fpsBuffer} = this;

        // Reset buffer
        for (let i = 0; i < fpsBuffer.length; i++) {
            fpsBuffer[i] = 0;
        }

        // TODO: Use device-pixel-ratio
        let latestFrame = performance.now();
        let fpsBufferIndex = 0;
        const renderLoop = async (): Promise<void> => {

            // Draw next generation
            await this.nextGeneration();

            // Save time this frame took
            const end = performance.now();
            fpsBuffer[fpsBufferIndex] = ~~(end - latestFrame);

            fpsBufferIndex++;
            if (fpsBufferIndex > Engine.FPS_BUFFER) {
                fpsBufferIndex = 0;
            }

            latestFrame = end;

            // Request next frame
            this.activeAnimationFrame = requestAnimationFrame(renderLoop);
        };

        requestAnimationFrame(renderLoop);
    }

    public async nextGeneration(): Promise<void> {
        const {ctx, shadowCtx, shadowCanvas, universe, env} = this;
        const {block, blockSize, width, height} = env;
        this.generation++;

        // Check if canvas has been moved since last redraw and clear screen
        if (this.moved) {
            shadowCtx.fillStyle = '#fff';
            shadowCtx.fillRect(0, 0, width, height);
            this.moved = false;
        }

        // Draw killed cells
        shadowCtx.beginPath();
        const killed = universe.killed();
        for (let i = 0; i < killed.length; i += 2) {
            const row = killed[i] * block;
            const col = killed[i + 1] * block;
            shadowCtx.rect(col, row, blockSize, blockSize);
        }

        shadowCtx.fillStyle = '#fff';
        shadowCtx.fill();

        // Draw living cells
        shadowCtx.beginPath();
        const resurrected = universe.resurrected();
        for (let i = 0; i < resurrected.length; i += 2) {
            const row = resurrected[i] * block;
            const col = resurrected[i + 1] * block;
            shadowCtx.rect(col, row, blockSize, blockSize);
        }

        shadowCtx.fillStyle = '#000';
        shadowCtx.fill();

        universe.nextGen();
        ctx.drawImage(shadowCanvas, 0, 0, width, height);
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

    public async transform(t: Transformation): Promise<void> {
        const {ctx, shadowCanvas, env} = this;
        const {width, height} = env;

        // Reset state
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, this.env.width, this.env.height);

        // Canvas has moved
        this.moved = true;

        // Apply transformation
        // TODO: Bug: Only changed-cells get re-drawed
        this.ctx.setTransform(
            t.scale, 0,
            0, t.scale,
            t.x, t.y
        );

        ctx.drawImage(shadowCanvas, 0, 0, width, height);
    }

    public async updateConfig(config: Config): Promise<void> {
        this.env = Engine.configToEnv(config);
        const {env, canvas, shadowCanvas, ctx} = this;
        const {width, height} = env;

        canvas.width = width;
        canvas.height = height;
        shadowCanvas.width = width;
        shadowCanvas.height = height;

        // Restore option
        ctx.imageSmoothingEnabled = false;
        await this.setMode(this.mode);
    }
}

expose(Engine);
