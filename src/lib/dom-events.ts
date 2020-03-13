type Methods = 'addEventListener' | 'removeEventListener';

interface EventBinding {
    (elements: EventTarget | Array<EventTarget>, events: string | Array<string>, fn: Function, options?: object): Array<unknown>;
}

/* eslint-disable prefer-rest-params */
function eventListener(method: Methods): EventBinding {
    return (elements: EventTarget | Array<EventTarget>, events: string | Array<string>, fn: Function, options = {}): Array<unknown> => {

        // Normalize array
        if (elements instanceof HTMLCollection || elements instanceof NodeList) {
            elements = Array.from(elements);
        } else if (!Array.isArray(elements)) {
            elements = [elements];
        }

        if (!Array.isArray(events)) {
            events = [events];
        }

        for (const el of elements) {
            const action = el[method];

            for (const ev of events) {
                /* eslint-disable @typescript-eslint/no-explicit-any */
                action(ev, fn as EventListener, {capture: false, ...options});
            }
        }

        return Array.prototype.slice.call(arguments, 1);
    };
}

/**
 * Add event(s) to element(s).
 * @param elements DOM-Elements
 * @param events Event names
 * @param fn Callback
 * @param options Optional options
 * @return Array passed arguments
 */
export const on = eventListener('addEventListener');

/**
 * Remove event(s) from element(s).
 * @param elements DOM-Elements
 * @param events Event names
 * @param fn Callback
 * @param options Optional options
 * @return Array passed arguments
 */
export const off = eventListener('removeEventListener');
