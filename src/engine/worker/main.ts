import {Universe}                       from '../../../crate/pkg';
import {Actor, ActorInstance, transfer} from '../../lib/actor/actor.main';
import {actor}                          from '../../lib/actor/actor.worker';
import {Graph}                          from './graph';
import {imageDataToSvg}                 from './main.utils';

export type Config = {
    width: number;
    height: number;
    cellSize: number;
};

export type Environment = {
    width: number;
    height: number;
    cols: number;
    rows: number;
    scale: number;
    cellSize: number;
    preScaleWidth: number;
    preScaleHeight: number;
};

export type Transformation = {
    scale: number;
    x: number;
    y: number;
};

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
    private readonly graphicalWorker: ActorInstance<Graph>;

    // Universe wrapper and wasm module
    /* eslint-disable @typescript-eslint/no-explicit-any */
    private readonly universe: Universe;
    private readonly wasm: any;

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

    // Universe-config
    private resurrectRules = 0b000001000;
    private surviveRules = 0b000001100;

    public get imageData(): ImageData {
        return new ImageData(
            new Uint8ClampedArray(
                this.wasm.memory.buffer,
                this.universe.image_data(),
                this.universe.image_size()
            ),
            this.env.preScaleWidth,
            this.env.preScaleHeight
        );
    }

    private constructor(
        canvas: OffscreenCanvas,
        env: Environment,
        graphicalWorker: ActorInstance<Graph>,
        universe: Universe,
        wasm: any
    ) {

        // Apply props
        this.env = env;
        this.wasm = wasm;
        this.universe = universe;
        this.graphicalWorker = graphicalWorker;

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', {
            antialias: false,
            alpha: false
        }) as OffscreenCanvasRenderingContext2D;

        // Reset canvas
        const {scale, width, height} = this.env;
        canvas.width = width;
        canvas.height = height;

        // We're drawing the shadowCanvas with this context,
        // using image-smoothing would blur pixels.
        this.ctx.imageSmoothingEnabled = false;

        // Pre-scale based on block-size
        this.ctx.scale(scale, scale);

        // Create shadow canvas
        this.shadowCanvas = new OffscreenCanvas(width, height);
        this.shadowCtx = this.shadowCanvas.getContext('2d', {
            antialias: false,
            alpha: false
        }) as OffscreenCanvasRenderingContext2D;

        // Clear canvas and initialize js-universe
        this.shadowCtx.fillStyle = '#fff';
        this.shadowCtx.fillRect(0, 0, width, height);

        // Draw initial state
        this.redraw();
    }

    public static async create(
        canvas: OffscreenCanvas,
        config: Config
    ): Promise<Engine> {
        const [{Universe}, wasm] = await Promise.all([
            import(/* webpackChunkName: "crate-wrapper" */ '../../../crate/pkg'),
            import(/* webpackChunkName: "crate-wasm" */ '../../../crate/pkg/index_bg.wasm')
        ]);

        // Convert config to env-properties
        const env = Engine.configToEnv(config);
        const [graphicalWorker, universe] = await Promise.all([
            new Actor(new Worker(
                './graph.ts',
                {type: 'module'}
            )).create<Graph>('Graph'),

            Universe.new(env.rows, env.cols)
        ]);

        return new Engine(
            canvas,
            env,
            graphicalWorker,
            universe,
            wasm
        );
    }

    private static configToEnv(conf: Config): Environment {
        const {width, height, cellSize} = conf;

        // Recalculate grid and canvas dimensions
        const realWidth = width - width % cellSize;
        const realHeight = height - height % cellSize;
        const cols = realWidth / cellSize;
        const rows = realHeight / cellSize;

        return {
            width: realWidth,
            height: realHeight,
            preScaleWidth: realWidth / cellSize,
            preScaleHeight: realHeight / cellSize,
            scale: cellSize,
            cellSize,
            rows,
            cols
        };
    }

    public pause(): void {
        this.running = false;

        // Cancel next frame
        if (this.activeAnimationFrame !== null) {
            cancelAnimationFrame(this.activeAnimationFrame);
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
            const duration = this.nextGeneration();

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

    public nextGeneration(): number {
        const start = performance.now();
        this.generation++;
        this.universe.next_gen();

        this.redraw();
        return performance.now() - start;
    }

    public limitFPS(limit: number | null): void {
        if (limit !== null && limit <= 0) {
            throw new Error(`FPS Cannot be limited to a negative number or zero (got ${limit})`);
        }

        this.fpsLimit = limit;
    }

    public transform(t: Transformation): void {
        const {ctx, shadowCanvas, env} = this;
        const {scale, width, height} = env;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // Reset current transformations
        this.ctx.resetTransform();

        // Transform
        this.ctx.transform(
            t.scale, 0,
            0, t.scale,
            t.x, t.y
        );

        // Scale to current block-size
        this.ctx.scale(scale, scale);

        // Redraw immediately
        ctx.drawImage(shadowCanvas, 0, 0, width, height);
    }

    private redraw(): void {
        const {universe} = this;

        this.graphicalWorker.commit('update',
            universe.killed_cells(),
            universe.resurrected_cells()
        );

        this.shadowCtx.putImageData(this.imageData, 0, 0);
        this.ctx.drawImage(this.shadowCanvas, 0, 0);
    }

    public async updateConfig(config: Config): Promise<void> {
        const {universe, canvas, shadowCanvas, ctx, running} = this;
        const {rows, cols, scale, width, height} = (
            this.env = Engine.configToEnv(config)
        );

        canvas.width = width;
        canvas.height = height;
        shadowCanvas.width = width;
        shadowCanvas.height = height;

        // Restore option
        ctx.imageSmoothingEnabled = false;

        // Re-scale
        this.ctx.scale(scale, scale);

        // Pause and resize universe
        this.pause();
        universe.resize(rows, cols);

        // Redraw
        this.redraw();

        // Auto-play if simulation was active
        if (running) {
            await this.play();
        }
    }

    public updateRuleset(resurrect: number, survive: number): void {
        this.resurrectRules = resurrect;
        this.surviveRules = survive;
        this.universe.set_ruleset(resurrect, survive);
    }

    public setGraphCanvas(canvas: OffscreenCanvas): void {
        this.graphicalWorker.commit('setCanvas', transfer(canvas));
    }

    public setCell(x: number, y: number, state: boolean): void {
        const {universe, shadowCtx, ctx, shadowCanvas} = this;
        universe.set_cell(x, y, state);

        // Redraw
        if (!this.running) {
            shadowCtx.putImageData(this.imageData, 0, 0);
            ctx.drawImage(shadowCanvas, 0, 0);
        }
    }

    public convertToSvg(inverse = false): string {
        return imageDataToSvg(
            this.imageData,
            this.env.cellSize,
            inverse
        );
    }

    public load(data: Uint8Array, cols: number): void {
        this.universe.load(data, cols);
        this.redraw();
    }

    public getCurrentGen(): Uint8Array {
        return new Uint8Array(
            this.wasm.memory.buffer,
            this.universe.current_gen(),
            this.universe.cell_count()
        );
    }

    public getEnv(): Environment {
        return this.env;
    }

    public getGeneration(): number {
        return this.generation;
    }

    public getFrameRate(): number {
        let total = 0;

        for (let i = 0; i < Engine.FPS_BUFFER; i++) {
            total += this.fpsBuffer[i];
        }

        return ~~(1000 / (total / Engine.FPS_BUFFER));
    }
}

