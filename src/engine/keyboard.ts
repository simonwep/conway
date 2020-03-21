const keysPressed = new Set();

window.addEventListener('keydown', e => {
    keysPressed.add(e.code);
});

window.addEventListener('keyup', e => {
    keysPressed.delete(e.code);
});

export const isKeyPressed = (name: string): boolean =>  {
    return keysPressed.has(name);
};
