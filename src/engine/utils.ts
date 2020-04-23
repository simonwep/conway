export function hdpiSizeOf(
    rect: DOMRect,
    ratio: number
): [number, number] {

    // Black magic, see https://stackoverflow.com/a/35244519/7664765
    const width = Math.round(ratio * rect.right) - Math.round(ratio * rect.left);
    const height = Math.round(ratio * rect.bottom) - Math.round(ratio * rect.top);
    return [width, height];
}

export function fullscreenCanvas(canvas: HTMLCanvasElement): void {
    const {innerWidth: w, innerHeight: h} = window;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.height = h;
    canvas.width = w;
}
