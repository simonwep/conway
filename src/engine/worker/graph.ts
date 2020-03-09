export type CanvasInitialization = {
    type: 'canvas';
    payload: OffscreenCanvas;
};

export type UpdatePayload = {
    killed: number;
    resurrected: number;
};

export type UpdateData = {
    type: 'update';
    payload: UpdatePayload;
};

// Target canvas
let canvas: OffscreenCanvas;
let ctx: OffscreenCanvasRenderingContext2D;

// Graph buffer
const BUFFER_SIZE = 1000 * 3; // n * (killed, resurrected, alive)
const buffer = new Uint32Array(BUFFER_SIZE);
let bufferOffset = 0;
let alive = 0;

// Update function
function update(data: UpdatePayload) {
    const {width, height} = canvas;

    // Update count of cells alive
    alive += data.resurrected - data.killed;

    // Update buffer and shift if full
    if (bufferOffset < buffer.length) {
        buffer[bufferOffset] = alive;
        buffer[bufferOffset + 1] = data.killed;
        buffer[bufferOffset + 2] = data.resurrected;
        bufferOffset += 3;
    } else {

        // Remove first element and override last
        buffer.copyWithin(0, 3, buffer.length);
        buffer[BUFFER_SIZE - 3] = alive;
        buffer[BUFFER_SIZE - 2] = data.killed;
        buffer[bufferOffset - 1] = data.resurrected;
    }

    // Current size of buffer, either it's filled or currently in the process
    const bufferSize = Math.min(bufferOffset, buffer.length);

    /**
     * Calculates the min-max values of periodic pairs.
     * @param items Amount of pairs (used as offset)
     */
    function calculateMinMaxValues(items: number): Array<[number, number]> {
        const minMax: Array<[number, number]> = [
            ...new Array(items)
        ].map(() => [0, Number.MAX_VALUE]);

        for (let i = 0; i < bufferSize; i += items) {
            for (let j = 0; j < items; j++) {
                const value = buffer[i + j];
                const group = minMax[j];

                if (value > group[0]) {
                    group[0] = value;
                } else if (value < group[1]) {
                    group[1] = value;
                }
            }
        }

        return minMax;
    }

    // Calculate current maximum of killed / resurrected cells
    const [
        [maxAlive, minAlive],
        [maxKilled, minKilled],
        [maxResurrected, minResurrected]
    ] = calculateMinMaxValues(3);


    // Calculate smallest possible y-factor for all three graphs
    const kpr = height / Math.max(
        (maxAlive - minAlive),
        (maxKilled - minKilled),
        (maxResurrected - minResurrected)
    );

    const xpr = width / bufferSize;

    /**
     * Draws a line-chart
     * @param color Stroke color
     * @param offset Array offset, where to start
     * @param step
     * @param yn Y-Normalizer Each value of source gets this value subtracted
     */
    function drawLineChart(
        color: string,
        offset: number,
        step: number,
        yn: number
    ) {
        ctx.strokeStyle = color;
        ctx.beginPath();

        for (let i = offset; i < bufferSize; i += step) {
            const x = xpr * i;
            const y = height - kpr * (buffer[i] - yn);

            if (i === offset) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid
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

    // Stroke styles
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Draw charts
    drawLineChart('#ff26a5', 0, 3, minAlive);
    drawLineChart('#ff2638', 1, 3, minKilled);
    drawLineChart('#26ff26', 2, 3, minResurrected);
}

// Listen to input
self.addEventListener('message', ev => {
    const msg = ev.data as (CanvasInitialization | UpdateData);

    switch (msg.type) {
        case 'canvas': {
            canvas = msg.payload;
            ctx = canvas.getContext('2d', {
                antialias: false,
                alpha: true
            }) as OffscreenCanvasRenderingContext2D;
            break;
        }
        case 'update': {
            if (canvas) {
                update(msg.payload);
            } else {
                alive += msg.payload.resurrected - msg.payload.killed;
            }
        }
    }
});
