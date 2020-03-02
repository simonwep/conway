/**
 * Returns a random number
 * @param min
 * @param max
 */
export function random(min: number, max: number): number {
    return (Math.random() * (max - min)) + min;
}
