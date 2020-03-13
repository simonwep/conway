import {actor}                       from '../../actor/actor.worker';
import {calculateMaximums, drawGrid} from './graph.utils';

@actor()
export class Graph {

    // Graph buffer
    private static GRAPH_PADDING = 10;
    private static BUFFER_SIZE = 250 * 3; // n * (killed, resurrected, alive)
    // Target canvas
    private canvas: OffscreenCanvas | null = null;
    private ctx: OffscreenCanvasRenderingContext2D | null = null;
    private buffer = new Uint32Array(Graph.BUFFER_SIZE);
    private bufferOffset = 0;
    private alive = 0;

    public setCanvas(canvas: OffscreenCanvas): void {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', {
            antialias: false,
            alpha: true
        }) as OffscreenCanvasRenderingContext2D;
    }

    public update(killed: number, resurrected: number): void {
        if (this.canvas) {
            this.render(killed, resurrected);
        } else {
            this.alive += resurrected - killed;
        }
    }

    private render(killed: number, resurrected: number): void {
        const {canvas, ctx, buffer} = this;

        if (!canvas || !ctx) {
            throw new Error('Not initialized yet.');
        }

        const {width, height} = canvas;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Update count of cells alive
        this.alive += resurrected - killed;

        // Update buffer and shift if full
        if (this.bufferOffset < buffer.length) {
            buffer[this.bufferOffset] = this.alive;
            buffer[this.bufferOffset + 1] = killed;
            buffer[this.bufferOffset + 2] = resurrected;
            this.bufferOffset += 3;
        } else {

            // Remove first element and override last
            buffer.copyWithin(0, 3, buffer.length);
            buffer[Graph.BUFFER_SIZE - 3] = this.alive;
            buffer[Graph.BUFFER_SIZE - 2] = killed;
            buffer[this.bufferOffset - 1] = resurrected;
        }

        // Current size of buffer, either it's filled or currently in the process
        const bufferSize = Math.min(this.bufferOffset, buffer.length);

        // Draw grid
        drawGrid(ctx, width, height);

        // Calculate current maximum of killed / resurrected cells
        const [maxAlive, maxKilled, maxResurrected] = calculateMaximums(3, buffer, bufferSize);

        // Calculate smallest possible scale
        const maxY = Math.max(maxAlive, maxKilled, maxResurrected);
        const graphHeight = height - Graph.GRAPH_PADDING * 2;
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
        const drawLineChart = (color: string, offset: number, step: number): void => {
            ctx.strokeStyle = color;
            ctx.beginPath();

            for (let i = offset; i < bufferSize; i += step) {
                const x = xpr * i;
                const y = graphHeight - kpr * buffer[i] + Graph.GRAPH_PADDING;

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
}
