import {ActorInstance} from '../../lib/actor/actor.main';
import {on}            from '../../lib/dom-events';
import {life}          from '../../store';
import {isKeyPressed}  from '../keyboard';
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
    const drawRect = (x: number = prevX, y: number = prevY): void => {
        const transformation = panning.getTransformation();

        // Total scale
        const scale = transformation.scale * life.cellSize;

        // Relative transformation of each pixel
        const ox = (transformation.x % scale);
        const oy = (transformation.y % scale);

        // Resolve coordinates in current space
        const rx = Math.floor((x - ox) / scale);
        const ry = Math.floor((y - oy) / scale);

        // Clear previous rect and draw new one
        context.clearRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = 'green';
        context.fillRect(
            Math.round(rx * scale + ox),
            Math.round(ry * scale + oy),
            Math.round(scale),
            Math.round(scale)
        );

        // Apply new pixel to life
        if (apply) {
            current.commit(
                'setCell',
                Math.floor(-transformation.x / scale + rx),
                Math.floor(-transformation.y / scale + ry),
                true
            );
        }

        prevX = x;
        prevY = y;
    };


    on(canvas, ['mousedown', 'touchstart'], () => {
        apply = !isKeyPressed('Space');
    });

    on(canvas, ['mouseup', 'touchend', 'touchcancel'], () => {
        apply = false;
    });

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
