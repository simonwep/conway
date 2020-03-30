/**
 * Converts the image-data to the svg-pixel equivalent
 * @param image Source
 * @param pixelSize Pixel-size
 * @param inverse If colors should be inversed
 */
export function imageDataToSvg(
    image: ImageData,
    pixelSize = 1,
    inverse = false
): string {
    const {width, height, data} = image;

    // Build map with a path for each cell-color
    const paths = new Map<string, string>();
    for (let i = 0; i < data.length; i += 4) {
        const pi = i / 4;
        const y = Math.floor(pi / width) * pixelSize;
        const x = (pi % width) * pixelSize;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Skip white pixels
        if (r + g + b < 255 * 3) {
            const color = `rgb(${r}, ${g}, ${b})`;
            const subPath = `M${x},${y}h${pixelSize}v${pixelSize}h-${pixelSize}v-${pixelSize} `;
            const path = paths.get(color) || '';
            paths.set(color, subPath + path);
        }
    }

    // Put everything together
    const fw = width * pixelSize;
    const fh = height * pixelSize;
    let str = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fw} ${fh}" ${inverse ? 'filter="url(#inverse)"' : ''} shape-rendering="crispEdges">`;

    // Inverse colors if wanted
    if (inverse) {
        str += '<filter id="inverse">'
            + '<feColorMatrix in="SourceGraphic" type="matrix" values="-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0"/>'
            + '</filter>';
    }

    // Background
    str += `<rect fill="white" x="0" y="0" width="${fw}" height="${fh}"/>`;

    // Pixels
    for (const [color, d] of paths.entries()) {
        str += `<path fill="${color}" d="${d}"/>`;
    }

    return `${str  }</svg>`;
}
