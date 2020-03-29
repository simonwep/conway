import {Actor, ActorInstance, transfer} from '../../lib/actor/actor.main';
import {actor}                          from '../../lib/actor/actor.worker';
import {UniverseWrapper}                from '../wrapper';
import {Graph}                          from './graph';

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

    // Universe-config
    private resurrectRules = 0b000001000;
    private surviveRules = 0b000001100;

    private constructor(
        canvas: OffscreenCanvas,
        env: Environment,
        graphicalWorker: ActorInstance<Graph>,
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
    }

    public static async create(
        canvas: OffscreenCanvas,
        config: Config
    ): Promise<Engine> {

        // Convert config to env-properties
        const env = Engine.configToEnv(config);
        const [graphicalWorker, universe] = await Promise.all([
            new Actor(new Worker(
                './graph.ts',
                {type: 'module'}
            )).create<Graph>('Graph'),

            UniverseWrapper.new(
                env.rows, env.cols,
                env.preScaleWidth, env.preScaleHeight
            )
        ]);

        return new Engine(
            canvas,
            env,
            graphicalWorker,
            universe
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
        const {ctx, shadowCtx, shadowCanvas, universe, env} = this;
        const {width, height} = env;
        const start = performance.now();
        this.generation++;

        // Transfer previous changes to graph-worker
        this.graphicalWorker.commit('update',
            universe.killedCells(),
            universe.resurrectedCells()
        );

        // Draw bitmap
        universe.nextGen();
        shadowCtx.putImageData(universe.imageData, 0, 0);

        ctx.drawImage(shadowCanvas, 0, 0, width, height);
        return performance.now() - start;
    }

    public limitFPS(limit: number | null): void {
        if (limit !== null && limit <= 0) {
            throw new Error(`FPS Cannot be limited to a negative number or zero (got ${limit})`);
        }

        this.fpsLimit = limit;
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

    public async updateConfig(config: Partial<Config>): Promise<void> {
        const {universe, canvas, shadowCanvas, shadowCtx, ctx, running} = this;
        const {rows, cols, preScaleWidth, preScaleHeight, scale, width, height} = (
            this.env = Engine.configToEnv({...this.env, ...config})
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
        universe.resize(
            rows, cols,
            preScaleWidth,
            preScaleHeight
        );

        // Redraw
        shadowCtx.putImageData(universe.imageData, 0, 0);
        ctx.drawImage(shadowCanvas, 0, 0);

        // Auto-play if simulation was active
        if (running) {
            await this.play();
        }
    }

    public updateRuleset(resurrect: number, survive: number): void {
        this.resurrectRules = resurrect;
        this.surviveRules = survive;
        this.universe.setRuleset(resurrect, survive);
    }

    public setGraphCanvas(canvas: OffscreenCanvas): void {
        this.graphicalWorker.commit('setCanvas', transfer(canvas));
    }

    public setCell(x: number, y: number, state: boolean): void {
        const {universe, shadowCtx, ctx, shadowCanvas} = this;
        universe.setCell(x, y, state);

        // Redraw
        if (!this.running) {
            shadowCtx.putImageData(universe.imageData, 0, 0);
            ctx.drawImage(shadowCanvas, 0, 0);
        }
    }

    public convertToSvg(): string {
        const {width, height, rows, cols, cellSize} = this.env;
        const cells = this.universe.currentGen();
        let path = '';

        for (let row = 0; row < rows; row++) {
            const offset = (row + 1) * (cols + 2);
            let lastCol = 0;
            let moved = false;

            for (let col = 0; col < cols; col++) {
                const index = offset + col;

                if (cells[index]) {
                    if (!moved) {
                        path += `M${col * cellSize},${row * cellSize}`;
                        moved = true;
                    } else {
                        path += `m${(col - lastCol) * cellSize},0`;
                    }

                    path += `h${cellSize}v${cellSize}h-${cellSize}v-${cellSize}`;
                    lastCol = col;
                }
            }
        }

        const pathEl = `<path fill="black" d="${path}"/>`;
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${pathEl}</svg>`;
    }

    public loadStateUnsafe(data: Uint8Array): void {
        this.universe.loadUnsafe(data);

        // Redraw
        if (!this.running) {
            this.shadowCtx.putImageData(this.universe.imageData, 0, 0);
            this.ctx.drawImage(this.shadowCanvas, 0, 0);
        }
    }

    public getCurrentState(): Uint8Array {
        return this.universe.currentGen();
    }
}

