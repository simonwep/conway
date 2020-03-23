import {ActorInstance}              from '../../lib/actor/actor.main';
import {on}                         from '../../lib/dom-events';
import {isKeyPressed, onKeyPressed} from '../keyboard';
import {Engine}                     from '../worker/main';

export type PanningInfo = {
    onZoomListeners: Array<Function>;
    getTransformation(): {
        scale: number;
        x: number;
        y: number;
    };
};

// TODO: Create class-based plugins
export const panning = (
    canvas: HTMLCanvasElement,
    current: ActorInstance<Engine>
): PanningInfo => {
    const onZoomListeners: Array<Function> = [];
    const zoomFactor = 1.5; // TODO: Adjust zoom-rate
    let scale = 1;
    let x = 0, y = 0;

    const updateTransformation = (): void => {
        current.commit('transform', {
            scale, x, y
        });

        for (const listener of onZoomListeners) {
            listener();
        }
    };

    canvas.addEventListener('wheel', e => {
        const delta = (e.deltaY < 0 ? zoomFactor : 1 / zoomFactor);

        if (scale === 1 && scale * delta < 1) {
            return;
        }

        scale = Math.round(scale * delta / 0.5) * 0.5;
        x = Math.round(e.pageX - (e.pageX - x) * delta);
        y = Math.round(e.pageY - (e.pageY - y) * delta);

        // Lock fullscreen
        // TODO: Weird cursor behaviour
        if (scale === 1) {
            x = 0;
            y = 0;
        }

        updateTransformation();
    });

    let dragging = false;
    let sx = 0, sy = 0;
    on(canvas, 'mousemove', (e: MouseEvent): void => {
        if (dragging && scale > 1) {
            x = Math.round(x + (e.pageX - sx));
            y = Math.round(y + (e.pageY - sy));
            sx = e.pageX;
            sy = e.pageY;
            updateTransformation();
        }
    });

    on(canvas, 'mousedown', (e: MouseEvent): void => {
        if (isKeyPressed(' ')) {
            dragging = true;
            sx = e.pageX;
            sy = e.pageY;
        }
    });

    on(canvas, ['mouseup', 'mouseleave'], (): void => {
        dragging = false;
    });

    onKeyPressed(' ', state => {
        canvas.style.cursor = state ? 'grab' : 'default';
    });

    return {
        onZoomListeners,
        getTransformation(): {scale: number; x: number; y: number} {
            return {scale, x, y};
        }
    };
};
