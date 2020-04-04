export const compressBooleanArray = (source: Uint8Array): Uint8Array => {
    const target = new Uint8Array(Math.ceil(source.length / 8));

    for (let i = 0; i < source.length; i++) {
        if (source[i] === 1) {
            const byte = Math.floor(i / 8);
            const bit = i % 8;
            target[byte] += 1 << bit;
        }
    }

    return target;
};

export const decompressBooleanArray = (source: Uint8Array): Uint8Array => {

    if (!source.length) {
        return new Uint8Array();
    }

    const lastValue = source[source.length - 1];
    const lastByte = lastValue ? Math.floor(Math.log2(source[source.length - 1]) + 1) : 1;
    const size = (source.length - 1) * 8 + lastByte;
    const target = new Uint8Array(size);

    for (let i = 0; i < size; i++) {
        const byte = Math.floor(i / 8);
        const bit = 1 << (i % 8);

        if ((source[byte] & bit) === bit) {
            target[i] = 1;
        }
    }

    return target;
};
