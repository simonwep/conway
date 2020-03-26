/**
 * Uses key, code to create a better readable and good-looking
 * description of which key got pressed.
 * @param e The source-event.
 */
export function prettyKeyCode(e: KeyboardEvent): string {
    const rawKey = e.key.trim();

    // The key-code ignores the user keyboard layout (see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Properties)
    // Use e.code as fallback in case of whitespace.
    let value = rawKey || e.code;

    // Remove redundant words
    value = value.replace(/digit|left/gi, '');

    // Put a space between each word / digit if not a list of characters is the result
    const words = value.split(/(?=[A-Z0-9])/g);
    if (!words.every(v => v.length === 1)) {
        value = words.join(' ');
    }

    return value;
}
