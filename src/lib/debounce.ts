/**
 * Debounce function calls.
 * @param fn Target function
 * @param duration debounce duration
 */
export function debounce<Func extends Function>(fn: Func, duration = 500): Func {
    let lastArgs: Array<unknown> = [];
    let lastCall = 0;
    let timeout = 0;

    return ((...args: Array<unknown>) => {
        const callTime = performance.now();
        const callDiff = callTime - lastCall;
        lastArgs = args;

        clearTimeout(timeout);
        if (callDiff < duration) {
            const remainingTime = duration - callDiff;

            timeout = setTimeout(() => {
                fn(...lastArgs);
            }, remainingTime) as unknown as number; // It's a number, trust me
        } else {
            fn(...args);
        }

        lastCall = callTime;
    }) as unknown as Func;
}
