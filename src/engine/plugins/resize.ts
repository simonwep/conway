import {ActorInstance} from '../../lib/actor/actor.main';
import {on}            from '../../lib/dom-events';
import {Engine}        from '../worker/main';

export const resize = (
    canvas: HTMLCanvasElement,
    current: ActorInstance<Engine>
): void => {
    let timeout: unknown = 0;
    on(window, 'resize', (): void => {
        clearTimeout(timeout as number);
        timeout = setTimeout(async () => {

            // Update canvas living inside of the worker
            await current.call('updateConfig', {
                width: window.innerWidth,
                height: window.innerHeight
            });
        }, 1000);
    });
};
