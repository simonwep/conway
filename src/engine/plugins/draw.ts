import {ActorInstance}   from '../../lib/actor/actor.main';
import {on}              from '../../lib/events';
import {life, shortcuts} from '../../store';
import {Engine}          from '../worker/main';
import {Panning}         from './panning';

enum Mode {
    Resurrect = 'Set',
    Kill = 'Kill'
}

export class Draw {
    private readonly panning: Panning;
    private readonly canvas: HTMLCanvasElement;
    private readonly engine: ActorInstance<Engine>;
    private readonly ctx: CanvasRenderingContext2D;
    private mode: Mode | null = null;
    private prevX = 0;
    private prevY = 0;

    constructor(panning: Panning, canvas: HTMLCanvasElement, engine: ActorInstance<Engine>) {
        this.panning = panning;
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

        this.bindListeners();
        this.fitToWindow();
    }

    private bindListeners(): void {
        const {canvas, panning} = this;

        on(canvas, ['mousedown', 'touchstart'], (e: MouseEvent) => {

            // Check if user is currently dragging stuff around or clicked another element
            if (
                shortcuts.isActive('panning') ||
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

        on(canvas, ['mouseup', 'touchend', 'touchcancel'], () => {
            this.mode = null;
        });

        on(canvas, ['mousemove', 'touchmove'], (e: MouseEvent) => {
            this.redraw(e.pageX, e.pageY);
        });

        on(window, 'resize', () => this.fitToWindow());
        on(panning, 'panning', () => this.redraw());
    }

    private fitToWindow(): void {
        this.canvas.height = window.innerHeight;
        this.canvas.width = window.innerWidth;
    }

    private redraw(x: number = this.prevX, y: number = this.prevY): void {
        const {panning: {transformation}, canvas, ctx, mode, engine} = this;

        // Total scale
        const scale = transformation.scale * life.cellSize;
        const roundedScale = Math.round(scale);

        // Relative transformation of each pixel
        const ox = (transformation.x % scale);
        const oy = (transformation.y % scale);

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
