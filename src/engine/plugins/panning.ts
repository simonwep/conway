import {ActorInstance} from '../../actor/actor.main';
import {on}            from '../../lib/dom-events';

/**
 * Panning feature
 * @param canvas
 * @param current
 */
export const panning = (
    canvas: HTMLCanvasElement,
    current: ActorInstance
) => {
    let scale = 1;
    const zoomFactor = 1.25;
    let x = 0, y = 0;
    canvas.addEventListener('wheel', async e => {
        const delta = (e.deltaY < 0 ? zoomFactor : 1 / zoomFactor);

        if (scale === 1 && scale * delta < 1) {
            return;
        }

        scale *= delta;
        x = Math.round(e.pageX - (e.pageX - x) * delta);
        y = Math.round(e.pageY - (e.pageY - y) * delta);

        // Lock fullscreen
        if (scale === 1) {
            canvas.style.cursor = 'default';
            x = 0;
            y = 0;
        } else {
            canvas.style.cursor = 'grab';
        }

        await current.call('transform', {
            scale, x, y
        });
    });

    let dragging = false;
    let sx = 0, sy = 0;
    on(canvas, 'mousemove', async (e: MouseEvent) => {
        if (dragging && scale > 1) {
            x = Math.round(x + (e.pageX - sx));
            y = Math.round(y + (e.pageY - sy));

            sx = e.pageX;
            sy = e.pageY;

            // TODO: Lock on edges
            await current.call('transform', {
                scale, x, y
            });
        }
    });

    on(canvas, 'mousedown', (e: MouseEvent) => {
        canvas.style.cursor = 'grabbing';
        dragging = true;
        sx = e.pageX;
        sy = e.pageY;
    });

    on(canvas, ['mouseup', 'mouseleave'], () => {
        canvas.style.cursor = 'grab';
        dragging = false;
    });
};
