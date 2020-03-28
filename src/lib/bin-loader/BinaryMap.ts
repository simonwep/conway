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

    private static sizeOf(val: string | number | Uint8Array, space = 8): number {
        if (val instanceof Uint8Array) {
            return val.length;
        }

        switch (typeof val) {
            case 'string': {
                return val.length;
            }
            case 'number': {
                return Math.floor(Math.log2(val) / space + 1);
            }
        }
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

    private static write(content: Uint8Array, target: Uint8Array, offset: number): number {

        // Write size of content and the content itself
        let size = content.length;
        while (size) {
            const value = (size & 127);
            size = size >> 7;

            target[offset] = value + (size & 255 ? 128 : 0);
            offset++;
        }

        target.set(content, offset);
        return offset + content.length;
    }

    public encode(): Uint8Array {
        const entries = [...this.entries()];

        // Calculate total size
        let totalSize = 0;
        for (const [key, value] of entries) {
            const kl = BinaryMap.sizeOf(key);
            const vl = BinaryMap.sizeOf(value);
            totalSize += kl + vl +
                BinaryMap.sizeOf(kl, 7) +
                BinaryMap.sizeOf(vl, 7);
        }

        // Write data
        let offset = 0;
        const data = new Uint8Array(totalSize);
        for (const [key, value] of entries) {
            offset = BinaryMap.write(BinaryMap.toUint8Array(key), data, offset);
            offset = BinaryMap.write(BinaryMap.toUint8Array(value), data, offset);
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
