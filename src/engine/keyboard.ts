type KeyboardKeyListener = (state: boolean) => void;

const keysPressed = new Set<string>();
const listeners = new Map<string, Array<KeyboardKeyListener>>();

const fireListenersFor = (key: string, state: boolean): void => {
    const fns = listeners.get(key) || [];
    for (const fn of fns) {
        fn(state);
    }
};

window.addEventListener('keydown', e => {
    fireListenersFor(e.code, true);
    keysPressed.add(e.code);
});

window.addEventListener('keyup', e => {
    fireListenersFor(e.code, false);
    keysPressed.delete(e.code);
});

export const isKeyPressed = (name: string): boolean => {
    return keysPressed.has(name);
};

export const onKeyPressed = (name: string, fn: KeyboardKeyListener): void => {
    const registered = listeners.get(name);

    if (registered) {
        registered.push(fn);
    } else {
        listeners.set(name, [fn]);
    }
};
