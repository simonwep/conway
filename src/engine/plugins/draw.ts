import {ActorInstance} from '../../lib/actor/actor.main';
import {on}            from '../../lib/dom-events';
import {life}          from '../../store';
import {isKeyPressed}  from '../keyboard';
import {Engine}        from '../worker/main';
import {PanningInfo}   from './panning';

enum Mode {
    Resurrect = 'Set',
    Kill = 'Kill'
}

export const draw = (
    panning: PanningInfo,
    canvas: HTMLCanvasElement,
    current: ActorInstance<Engine>
): void => {
    canvas.style.pointerEvents = 'none';
    const context = canvas.getContext('2d', {
        antialias: false
    }) as CanvasRenderingContext2D;

    // Green for new cells :)
    context.fillStyle = 'rgb(0, 255, 0)';
    context.strokeStyle = 'rgb(0, 255, 0)';

    let mode: Mode | null = null;
    let prevX = 0, prevY = 0;
    const drawRect = (x: number = prevX, y: number = prevY): void => {
        const transformation = panning.getTransformation();

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
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Draw cursor
        const cx = Math.round(rx * scale + ox);
        const cy = Math.round(ry * scale + oy + 0.5);
        const th = Math.max(1, Math.ceil(scale / 10));
        const th2 = th * 2;
        context.fillRect(cx - th, cy - th, roundedScale + th2, roundedScale + th2);
        context.clearRect(cx + th, cy + th, roundedScale - th2, roundedScale - th2);

        // Apply new pixel to life
        if (mode) {
            current.commit(
                'setCell',
                Math.floor(-transformation.x / scale + rx),
                Math.floor(-transformation.y / scale + ry),
                mode === Mode.Resurrect
            );
        }

        prevX = x;
        prevY = y;
    };


    on(canvas, ['mousedown', 'touchstart'], (e: MouseEvent) => {

        // Check if user wants to drag stuff around
        if (isKeyPressed('Space')) {
            return;
        }

        switch (e.button) {
            case 0: {
                mode = Mode.Resurrect;
                drawRect();
                break;
            }
            case 2: {
                mode = Mode.Kill;
                drawRect();
            }
        }
    });

    on(canvas, ['mouseup', 'touchend', 'touchcancel'], () => {
        mode = null;
    });

    // TODO: Don't draw over child-elements
    on(canvas, 'mousemove', (e: MouseEvent) => {
        drawRect(e.pageX, e.pageY);
    });

    const resize = (): void => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drawRect();
    };

    panning.onZoomListeners.push(drawRect);
    on(window, 'resize', resize);
    resize();
};
