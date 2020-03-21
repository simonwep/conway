import {ActorInstance} from '../../lib/actor/actor.main';
import {on}            from '../../lib/dom-events';
import {life}          from '../../store';
import {Engine}        from '../worker/main';
import {PanningInfo}   from './panning';

export const draw = (
    panning: PanningInfo,
    canvas: HTMLCanvasElement,
    current: ActorInstance<Engine>
): void => {
    canvas.style.pointerEvents = 'none';
    const context = canvas.getContext('2d', {
        antialias: false
    }) as CanvasRenderingContext2D;

    let apply = false;
    let prevX = 0, prevY = 0;
    const drawRect = (x: number, y: number): void => {
        const transformation = panning.getTransformation();

        // Total scale
        const scale = transformation.scale * life.cellSize;

        // Relative transformation of each pixel
        const ox = (transformation.x % scale);
        const oy = (transformation.y % scale);

        // Final coordinates
        const bx = Math.round(x / scale) * scale + ox;
        const by = Math.round(y / scale) * scale + oy;

        // Clear previous rect and draw new one
        context.clearRect(0, 0, canvas.width, canvas.height);

        context.fillRect(
            Math.round(bx),
            Math.round(by),
            Math.round(scale),
            Math.round(scale)
        );

        // Apply new pixel to life
        if (apply) {
            const vx = x / scale;
            const vy = y / scale;

            // TODO: Buggy while zoomed in
            current.commit(
                'setCell',
                Math.floor(vx),
                Math.floor(vy),
                true
            );
        }

        prevX = x;
        prevY = y;
    };

    context.fillStyle = 'red';

    // TODO: Add hotkey?
    on(canvas, ['mousedown', 'touchstart'], () => apply = true);
    on(canvas, ['mouseup', 'touchend', 'touchcancel'], () => apply = false);
    on(canvas, 'mousemove', (e: MouseEvent) => {
        drawRect(e.pageX, e.pageY);
    });

    const resize = (): void => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drawRect(prevX, prevY);
    };

    panning.onZoomListeners.push(() => {
        drawRect(prevX, prevY);
    });

    on(window, 'resize', resize);
    resize();
};
