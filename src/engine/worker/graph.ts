import {calculateMaximums, drawGrid} from './graph.utils';

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
const GRAPH_PADDING = 10;
const BUFFER_SIZE = 250 * 3; // n * (killed, resurrected, alive)
const buffer = new Uint32Array(BUFFER_SIZE);
let bufferOffset = 0;
let alive = 0;

// Update function
function update(data: UpdatePayload) {
    const {width, height} = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

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

    // Draw grid
    drawGrid(ctx, width, height);

    // Calculate current maximum of killed / resurrected cells
    const [maxAlive, maxKilled, maxResurrected] = calculateMaximums(3, buffer, bufferSize);

    // Calculate smallest possible scale
    const maxY = Math.max(maxAlive, maxKilled, maxResurrected);
    const graphHeight = height - GRAPH_PADDING * 2;
    const kpr = graphHeight / maxY;
    const xpr = width / bufferSize;

    // Stroke styles
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    /**
     * Draws a line-chart
     * @param color Stroke color
     * @param offset Array offset, where to start
     * @param step
     */
    const drawLineChart = (color: string, offset: number, step: number) => {
        ctx.strokeStyle = color;
        ctx.beginPath();

        for (let i = offset; i < bufferSize; i += step) {
            const x = xpr * i;
            const y = graphHeight - kpr * buffer[i] + GRAPH_PADDING;

            if (i === offset) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
    };

    // Draw charts
    drawLineChart('#ff26a5', 0, 3);
    drawLineChart('#ff2638', 1, 3);
    drawLineChart('#26ff26', 2, 3);
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
