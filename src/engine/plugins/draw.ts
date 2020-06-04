import {ActorInstance}                from '../../lib/actor/actor.main';
import {on}                           from '../../lib/events';
import {KeyboardShortcuts}            from '../../store/models/KeyboardShortcuts';
import {Life}                         from '../store'; // TODO: Move to class-attribute
import {Engine}                       from '../worker/main';
import {fullscreenCanvas, hdpiSizeOf} from '../utils';
import {Panning}                      from './panning';

enum Mode {
    Resurrect = 'Set',
    Kill = 'Kill'
}

export class Draw {
    private readonly panning: Panning;
    private readonly mainCanvas: HTMLCanvasElement;
    private readonly canvas: HTMLCanvasElement;
    private readonly engine: ActorInstance<Engine>;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly shortcuts: KeyboardShortcuts;
    private readonly life: Life;
    private mode: Mode | null = null;
    private prevX = 0;
    private prevY = 0;

    constructor(
        panning: Panning,
        canvas: HTMLCanvasElement,
        mainCanvas: HTMLCanvasElement,
        engine: ActorInstance<Engine>,
        shortcuts: KeyboardShortcuts,
        life: Life
    ) {
        this.panning = panning;
        this.mainCanvas = mainCanvas;
        this.shortcuts = shortcuts;
        this.life = life;
        this.canvas = canvas;
        this.engine = engine;
        this.ctx = canvas.getContext('2d', {
            antialias: false
        }) as CanvasRenderingContext2D;

        // Green for new cells :)
        this.ctx.fillStyle = 'rgb(0, 255, 0)';
        this.ctx.strokeStyle = 'rgb(0, 255, 0)';

        // The canvas acts as overlay but the main-canvas below this one
        // should still be able to interact with.
        canvas.style.pointerEvents = 'none';

        this.resize();
        this.bindListeners();
    }

    private resize() {
        const {canvas} = this;
        fullscreenCanvas(canvas);

        const [width, height] = hdpiSizeOf(canvas.getBoundingClientRect(), devicePixelRatio);
        canvas.height = height;
        canvas.width = width;
    }

    private bindListeners(): void {
        const {mainCanvas, panning, shortcuts} = this;

        on(mainCanvas, ['mousedown', 'touchstart'], (e: MouseEvent) => {

            // Check if user is currently dragging stuff around or clicked another element
            if (shortcuts.isActive('panning') ||
                (e.target as HTMLElement).parentElement !== document.body
            ) {
                return;
            }

            switch (e.button) {
                case 0: {
                    this.mode = Mode.Resurrect;
                    this.redraw();
                    break;
                }
                case 2: {
                    this.mode = Mode.Kill;
                    this.redraw();
                }
            }
        });

        on(mainCanvas, ['mouseup', 'touchend', 'touchcancel'], () => {
            this.mode = null;
        });

        on(mainCanvas, ['mousemove', 'touchmove'], (e: MouseEvent) => {
            this.redraw(e.pageX * devicePixelRatio, e.pageY * devicePixelRatio);
        });

        on(window, 'resize', () => this.resize());
        on(panning, 'panning', () => this.redraw());
    }

    private redraw(x: number = this.prevX, y: number = this.prevY): void {
        const {panning: {transformation}, canvas, ctx, mode, engine, life} = this;

        // Total scale
        const scale = transformation.scale * life.cellSize;
        const roundedScale = Math.round(scale);

        // Relative transformation of each pixel and
        // add canvas-margin to transformation which is the amount of remaining pixels
        // which couldn't be filled with cells.
        const {height, width} = canvas;
        const ox = (transformation.x + (width % life.cellSize) / 2) % scale;
        const oy = (transformation.y + (height % life.cellSize) / 2) % scale;

        // Resolve coordinates in current space
        const rx = Math.floor((x - ox) / scale);
        const ry = Math.floor((y - oy) / scale);

        // Clear previous rect and draw new one
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw cursor
        const cx = Math.round(rx * scale + ox);
        const cy = Math.round(ry * scale + oy + 0.5);
        const th = Math.max(1, Math.ceil(scale / 10));
        const th2 = th * 2;
        ctx.fillRect(cx - th, cy - th, roundedScale + th2, roundedScale + th2);
        ctx.clearRect(cx + th, cy + th, roundedScale - th2, roundedScale - th2);

        // Apply new pixel to life
        if (mode) {
            engine.commit(
                'setCell',
                Math.floor(-transformation.x / scale + rx),
                Math.floor(-transformation.y / scale + ry),
                mode === Mode.Resurrect
            );
        }

        this.prevX = x;
        this.prevY = y;
    }
}
