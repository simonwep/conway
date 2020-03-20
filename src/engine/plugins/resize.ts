import {ActorInstance} from '../../lib/actor/actor.main';
import {on}            from '../../lib/dom-events';
import {Engine}        from '../worker/main';

/**
 * Panning feature
 * @param canvas
 * @param current
 */
export const resize = (
    canvas: HTMLCanvasElement,
    current: ActorInstance<Engine>
): void => {
    let timeout: unknown = 0;
    on(window, 'resize', (): void => {
        clearTimeout(timeout as number);
        timeout = setTimeout(async () => {
            await current.call('updateConfig', {
                width: window.innerWidth,
                height: window.innerHeight
            });
        }, 1000);
    });
};
