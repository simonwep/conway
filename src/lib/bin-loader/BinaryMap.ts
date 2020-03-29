export enum Types {
    Number = 'number',
    String = 'string',
    Uint8Array = 'uint8array'
}

type TypeMap = {
    [Types.Number]: number;
    [Types.String]: string;
    [Types.Uint8Array]: Uint8Array;
};

export class BinaryMap<V extends Uint8Array | string | number> extends Map<string, V> {
    private static readonly textEncoder = new TextEncoder();
    private static readonly textDecoder = new TextDecoder();

    public static fromUint8Array<T extends Types>(value: Uint8Array, type: T): TypeMap[T] | null {
        switch (type) {
            case Types.Number: {
                let val = 0;

                for (let i = 0; i < value.length; i++) {
                    val += value[i] << (i * 8);
                }

                return val as TypeMap[T];
            }
            case Types.String: {
                return BinaryMap.textDecoder.decode(value) as TypeMap[T];
            }
            case Types.Uint8Array: {
                return value as TypeMap[T];
            }
        }

        return null;
    }

    public static toUint8Array(val: string | number | Uint8Array): Uint8Array {
        if (val instanceof Uint8Array) {
            return val;
        }

        switch (typeof val) {
            case 'string': {
                return BinaryMap.textEncoder.encode(val);
            }
            case 'number': {
                const bits = Math.floor(Math.log2(val) + 1);
                const length = Math.ceil(bits / 8);
                const data = new Uint8Array(length);
                let offset = 0;

                while (val) {
                    data[offset] = val & 255;
                    val = val >> 8;
                    offset++;
                }

                return data;
            }
        }
    }

    public static decode(bin: Uint8Array): BinaryMap<Uint8Array> {
        const sections = new BinaryMap<Uint8Array>();
        let data: Uint8Array;
        let offset = 0;

        // TODO: Throw error on overflow?
        while (offset < bin.length) {
            [offset, data] = BinaryMap.read(bin, offset);
            const str = BinaryMap.textDecoder.decode(data);

            [offset, data] = BinaryMap.read(bin, offset);
            sections.set(str, data);
        }

        return sections;
    }

    private static read(content: Uint8Array, offset: number): [number, Uint8Array] {
        const initialOffset = offset;

        // Read size of next chunk
        let size = 0;
        let value = 128;
        while (value & 128) {
            value = content[offset];
            size += (value & 127) << (offset - initialOffset) * 7;
            offset++;
        }

        const nextOffset = offset + size;
        return [
            nextOffset,
            new Uint8Array(content.slice(offset, nextOffset))
        ];
    }

    private static pack(content: Uint8Array): Uint8Array {
        const sizeSpace = Math.ceil((Math.log2(content.length) + 1) / 7);
        const target = new Uint8Array(sizeSpace + content.length);

        // Write size of content and the content itself
        let size = content.length;
        let offset = 0;
        while (size) {
            const value = (size & 127);
            size = size >> 7;

            target[offset] = value + (size & 255 ? 128 : 0);
            offset++;
        }

        target.set(content, offset);
        return target;
    }

    private static concat(...arrays: Array<Uint8Array>): Uint8Array {
        const length = arrays.reduce((pv, cv) => pv + cv.length, 0);
        const target = new Uint8Array(length);

        let offset = 0;
        for (const array of arrays) {
            target.set(array, offset);
            offset += array.length;
        }

        return target;
    }

    public encode(): Uint8Array {
        let data = new Uint8Array();

        // Convert items to Uint8Arrays
        for (const [key, value] of this.entries()) {
            data = BinaryMap.concat(data,
                BinaryMap.pack(BinaryMap.toUint8Array(key)),
                BinaryMap.pack(BinaryMap.toUint8Array(value))
            );
        }

        return data;
    }

    public getDecoded<T extends Types>(name: string, type: T): TypeMap[T] | null {
        const raw = this.get(name) as Uint8Array | undefined;

        if (raw === undefined) {
            return null;
        }

        return BinaryMap.fromUint8Array(raw, type);
    }
}
