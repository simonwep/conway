import {Remote}       from 'comlink';
import {on}           from '../../lib/dom-events';
import {EngineWorker} from '../worker/main';

/**
 * Panning feature
 * @param canvas
 * @param current
 */
export const resize = (
    canvas: HTMLCanvasElement,
    current: Remote<EngineWorker>
) => {
    let timeout: unknown = 0;
    on(window, 'resize', () => {
        clearTimeout(timeout as number);
        timeout = setTimeout(async () => {
            await current.updateConfig({
                width: window.innerWidth,
                height: window.innerHeight
            });
        }, 1000);
    });
};
