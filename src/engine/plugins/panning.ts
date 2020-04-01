import {ActorInstance}          from '../../lib/actor/actor.main';
import {debounce}               from '../../lib/debounce';
import {on}                     from '../../lib/events';
import {KeyboardShortcuts}      from '../../store/models/KeyboardShortcuts';
import {Engine, Transformation} from '../worker/main';

export class PanningEvent extends Event {
    public readonly transformation: Transformation;

    constructor(transformation: Transformation) {
        super('panning');
        this.transformation = transformation;
    }
}

export class Panning extends EventTarget {
    private static readonly ZOOM_FACTOR = 1.5;
    public readonly transformation: Transformation;
    private readonly canvas: HTMLCanvasElement;
    private readonly shortcuts: KeyboardShortcuts;
    private readonly engine: ActorInstance<Engine>;

    constructor(
        canvas: HTMLCanvasElement,
        engine: ActorInstance<Engine>,
        shortcuts: KeyboardShortcuts
    ) {
        super();
        this.canvas = canvas;
        this.engine = engine;
        this.shortcuts = shortcuts;
        this.transformation = {
            scale: 1,
            x: 0,
            y: 0
        };

        // Register keyboard-shortcuts for this module
        shortcuts.register({
            name: 'panning',
            description: 'Drag with mouse',
            binding: ['Control']
        });

        shortcuts.onChange('panning', state => {
            canvas.style.cursor = state && this.transformation.scale !== 1 ? 'grab' : 'default';
        });

        this.bindListeners();
    }

    private bindListeners(): void {
        const {ZOOM_FACTOR} = Panning;
        const {canvas, transformation} = this;

        canvas.addEventListener('wheel', e => {
            const delta = (e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR);
            const {scale, x, y} = transformation;

            if (scale === 1 && scale * delta < 1) {
                return;
            }

            transformation.scale = Math.round(scale * delta / 0.5) * 0.5;
            transformation.x = Math.round(e.pageX - (e.pageX - x) * delta);
            transformation.y = Math.round(e.pageY - (e.pageY - y) * delta);

            // Lock fullscreen
            if (transformation.scale === 1) {
                transformation.x = 0;
                transformation.y = 0;
            }

            e.preventDefault();
            this.pushTransformation();
        });

        let dragging = false;
        let sx = 0, sy = 0;
        on(canvas, 'mousemove', (e: MouseEvent): void => {

            if (dragging && transformation.scale > 1) {
                const {x, y} = transformation;

                transformation.x = Math.round(x + (e.pageX - sx));
                transformation.y = Math.round(y + (e.pageY - sy));

                sx = e.pageX;
                sy = e.pageY;

                this.pushTransformation();
            }
        });

        on(canvas, 'mousedown', (e: MouseEvent): void => {
            if (this.shortcuts.isActive('panning')) {
                dragging = true;
                sx = e.pageX;
                sy = e.pageY;
            }
        });

        on(canvas, ['mouseup', 'mouseleave'], (): void => {
            dragging = false;
        });

        on(window, 'resize', debounce((): void => {

            // Update canvas living inside of the worker
            this.engine.commit('updateConfig', {
                width: window.innerWidth,
                height: window.innerHeight
            });
        }));
    }

    private pushTransformation(): void {
        const {transformation} = this;
        this.engine.commit('transform', transformation);
        this.dispatchEvent(new PanningEvent(transformation));
    }
}
