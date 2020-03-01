/**
 * Used to join the values of multiple css-classes (due to css-module)
 * @param str
 */
export function joinStrings(...str: Array<string>): string {
    return str.join(' ');
}
