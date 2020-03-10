/**
 * Calculates the min-max values of periodic pairs.
 * @param items Amount of pairs (used as offset)
 * @param array The source array.
 * @param stopAt Optional stop index.
 */
export function calculateMaximums(
    items: number,
    array: ArrayLike<number>,
    stopAt = array.length
): Array<number> {
    const max = [...new Array(items)].fill(0);

    for (let i = 0; i < stopAt; i += items) {
        for (let j = 0; j < items; j++) {
            const value = array[i + j];

            if (value > max[j]) {
                max[j] = value;
            }
        }
    }

    return max;
}

/**
 * Draws a retro-grid.
 * @param ctx The canvas context
 * @param width Width of canvas
 * @param height Height of canvas
 */
export function drawGrid(
    ctx: OffscreenCanvasRenderingContext2D,
    width: number,
    height: number
) {
    const gx = width / 2;
    const gy = height / 2;
    const gradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(width, height) * 0.75);

    gradient.addColorStop(0, 'rgba(239,0,255,0.25)');
    gradient.addColorStop(.5, 'rgba(131,0,255,0.5)');
    gradient.addColorStop(0.95, 'rgba(0,135,243,1)');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 5.5; x < width; x += 10) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }

    for (let y = 5.5; y < height; y += 10) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }

    ctx.setTransform(1, 0, 0, 0.5, 0, 0.25 * height);
    ctx.stroke();
    ctx.resetTransform();
}
