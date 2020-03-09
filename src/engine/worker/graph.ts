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
            }
        }
    }
});

// Graph buffer
const BUFFER_SIZE = 500 * 2; // 100 * (killed, resurrected)
const buffer = new Uint32Array(BUFFER_SIZE);
let bufferOffset = 0;

// Update function
function update(data: UpdatePayload) {
    const {width, height} = canvas;

    // Update buffer and shift if full
    if (bufferOffset < buffer.length) {
        buffer[bufferOffset] = data.killed;
        buffer[bufferOffset + 1] = data.resurrected;
        bufferOffset += 2;
    } else {

        // Remove first element and override last
        buffer.copyWithin(0, 2, buffer.length);
        buffer[BUFFER_SIZE - 2] = data.killed;
        buffer[bufferOffset - 1] = data.resurrected;
    }

    // Current size of buffer, either it's filled or currently in the process
    const bufferSize = Math.min(bufferOffset, buffer.length);

    // Calculate current maximum of killed / resurrected cells
    let maxKilled = 0;
    let maxResurrected = 0;
    let minKilled = Number.MAX_VALUE;
    let minResurrected = Number.MAX_VALUE;
    for (let i = 0; i < bufferSize; i += 2) {
        const killed = buffer[i];
        const resurrected = buffer[i + 1];

        if (killed > maxKilled) {
            maxKilled = killed;
        } else if (killed < minKilled) {
            minKilled = killed;
        }

        if (resurrected > maxResurrected) {
            maxResurrected = resurrected;
        } else if (resurrected < minResurrected) {
            minResurrected = resurrected;
        }
    }

    const kpr = height / (maxKilled - minKilled);
    const xpr = width / bufferSize;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw lines
    ctx.strokeStyle = '#ff2638';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();

    for (let i = 0; i < bufferSize; i += 2) {
        const x = xpr * i;
        const y = kpr * (buffer[i] - minKilled);

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    ctx.stroke();

    // Draw lines
    ctx.strokeStyle = '#26ff26';
    ctx.beginPath();

    for (let i = 1; i < bufferSize; i += 2) {
        const x = xpr * i;
        const y = kpr * (buffer[i] - minResurrected);

        if (i === 1) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    ctx.stroke();
}





























