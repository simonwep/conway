import {Remote} from 'comlink';
import {life}   from '../store';
import {Engine} from './engine';

/**
 * Synchronized between store and canvas
 * @param canvas
 * @param current
 */
export const storesync = (
    canvas: HTMLCanvasElement,
    current: Remote<Engine>
) => {
    setInterval(async () => {
        life.fps = await current.getFrameRate();
        life.generation = await current.getGeneration();
    }, 1000);
};
