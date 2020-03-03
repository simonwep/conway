import {Remote} from 'comlink';
import {Engine} from './engine';

/**
 * Panning feature
 * @param canvas
 * @param current
 */
export const panning = (
    canvas: HTMLCanvasElement,
    current: Remote<Engine>
) => {
    let scale = 1;
    const zoomFactor = 2;
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

        await current.transform({
            scale, x, y
        });
    });

    let dragging = false;
    let sx = 0, sy = 0;
    canvas.addEventListener('mousemove', async e => {
        if (dragging && scale > 1) {
            x = Math.round(x + (e.pageX - sx));
            y = Math.round(y + (e.pageY - sy));

            sx = e.pageX;
            sy = e.pageY;

            // TODO: Lock on edges
            await current.transform({
                scale, x, y
            });
        }
    });

    canvas.addEventListener('mousedown', e => {
        canvas.style.cursor = 'grabbing';
        dragging = true;
        sx = e.pageX;
        sy = e.pageY;
    });

    canvas.addEventListener('mouseup', () => {
        canvas.style.cursor = 'grab';
        dragging = false;
    });
};