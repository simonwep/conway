import {Actor, ActorInstance, transfer} from '../../actor/actor.main';
import {actor}                          from '../../actor/actor.worker';
import {UniverseWrapper}                from '../wrapper';
import {Graph}                          from './graph';

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

/* eslint-disable @typescript-eslint/no-non-null-assertion */
@actor('create')
export class Engine {

    // Amount of single frames to stabilize the fps
    public static readonly FPS_BUFFER = 16;

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

    // Child-worker responsible for drawing the charts
    private readonly graphicalWorker: ActorInstance;

    // Rust wrapper
    private universe: UniverseWrapper;

    // Currently requested frame.
    private activeAnimationFrame: number | null = null;

    // env-data such as screen size, size of block etc.
    private env: Environment;

    // If simulation is running.
    private running = false;

    // Current generation.
    private generation = 0;

    // FPS limiter, null means no limit
    private fpsLimit: number | null = null;

    private constructor(
        canvas: OffscreenCanvas,
        env: Environment,
        graphicalWorker: ActorInstance,
        universe: UniverseWrapper
    ) {

        // Apply props
        this.env = env;
        this.universe = universe;
        this.graphicalWorker = graphicalWorker;

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', {
            antialias: false,
            alpha: false
        }) as OffscreenCanvasRenderingContext2D;

        // Reset canvas
        const {width, height} = this.env;
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
    }

    public static async create(
        canvas: OffscreenCanvas,
        config: Config
    ): Promise<Engine> {

        // Convert config to env-properties
        const env = Engine.configToEnv(config);

        const graphicalWorker = await new Actor(new Worker(
            './graph.ts',
            {type: 'module'}
        )).create('Graph');

        const universe = await UniverseWrapper.new(
            env.rows,
            env.cols
        );

        return new Engine(
            canvas,
            env,
            graphicalWorker,
            universe
        );
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

    public async recreateUniverse(): Promise<void> {
        const {rows, cols} = this.env;

        this.universe = await UniverseWrapper.new(
            rows,
            cols
        );
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

        // TODO: Use device-pixel-ratio
        let latestFrame = performance.now();
        let fpsBufferIndex = 0;

        const renderLoop = async (): Promise<void> => {
            const end = performance.now();
            if (!this.running) {
                return;
            }

            // Update fps-buffer
            if (latestFrame !== 0) {
                fpsBuffer[fpsBufferIndex++] = end - latestFrame;

                // Rotate if out-of-bounds
                if (fpsBufferIndex > Engine.FPS_BUFFER) {
                    fpsBufferIndex = 0;
                }
            }

            latestFrame = end;

            // Draw next generation
            const duration = await this.nextGeneration();

            // Check if fps-limit is enabled
            if (this.fpsLimit !== null) {
                const targetDiff = (1000 / this.fpsLimit);
                const rest = targetDiff - duration;

                // Wait for at least more than a single millisecond
                if (rest > 16) {
                    setTimeout(renderLoop, rest);
                    return;
                }
            }

            this.activeAnimationFrame = requestAnimationFrame(renderLoop);
        };

        requestAnimationFrame(renderLoop);
    }

    public async nextGeneration(): Promise<number> {
        const {ctx, shadowCtx, shadowCanvas, universe, env} = this;
        const {block, blockSize, width, height} = env;
        const start = performance.now();
        this.generation++;

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

        // Transfer changes to graph-worker
        this.graphicalWorker.commit('update',
            killed.length / 2,
            resurrected.length / 2
        );

        universe.nextGen();
        ctx.drawImage(shadowCanvas, 0, 0, width, height);
        return performance.now() - start;
    }

    public async limitFPS(limit: number | null): Promise<void> {
        if (limit !== null && limit <= 0) {
            throw new Error(`FPS Cannot be limited to a negative number or zero (got ${limit})`);
        }

        this.fpsLimit = limit;
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
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // Apply transformation
        this.ctx.setTransform(
            t.scale, 0,
            0, t.scale,
            t.x, t.y
        );

        // Redraw immediately
        ctx.drawImage(shadowCanvas, 0, 0, width, height);
    }

    public async updateConfig(config: Partial<Config>): Promise<void> {
        this.env = Engine.configToEnv({...this.env, ...config});
        const {env, canvas, shadowCanvas, shadowCtx, ctx, running} = this;
        const {width, height} = env;

        canvas.width = width;
        canvas.height = height;
        shadowCanvas.width = width;
        shadowCanvas.height = height;

        // Restore option
        ctx.imageSmoothingEnabled = false;

        // Clear
        shadowCtx.fillStyle = 'white';
        shadowCtx.fillRect(0, 0, width, height);
        ctx.drawImage(shadowCanvas, 0, 0, width, height);

        // Stop and re-create universe
        await this.stop();
        await this.recreateUniverse();

        // Auto-play if simulation was active
        if (running) {
            await this.play();
        }
    }

    public async updateRuleset(resurrect: number, survive: number): Promise<void> {
        this.universe.setRuleset(resurrect, survive);
    }

    public async setGraphCanvas(canvas: OffscreenCanvas): Promise<void> {
        this.graphicalWorker.commit('setCanvas', transfer(canvas));
    }
}

