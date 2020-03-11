export type WorkerInstantiation = {
    type: 'instantiation';
    requestId: number;
    name: string;
    args: Array<unknown>;
};

export type WorkerFunctionCall = {
    type: 'call';
    requestId: number | null;
    target: number;
    functionName: string;
    args: Array<unknown>;
};

export type WorkerInstantiationReply = {
    type: 'instantiation';
    requestId: number;
    instanceId: number;
};

export type WorkerFunctionCallReply = {
    type: 'call';
    requestId: number;
    value: unknown;
    ok: boolean;
};

const TRANSFER_KEY = Symbol('transfer.key');

/**
 * Wraps a value which shall be transferred to the worker.
 * @param value
 */
export function transfer<T extends Transferable>(value: T): T {
    return [
        TRANSFER_KEY,
        value
    ] as unknown as T;
}

/**
 * Resolves arguments to a list with pure arguments and these which shall
 * be transferred to the worker (previously wrapped with transfer())
 * @param args
 */
function resolveArguments(args: Array<unknown>): [Array<unknown>, Array<Transferable>] {
    const transferable: Array<Transferable> = [];
    const rawArgs: Array<unknown> = [];

    // Untangle arguments
    for (const arg of args) {
        if (Array.isArray(arg) && arg[0] === TRANSFER_KEY) {
            transferable.push(arg[1]);
            rawArgs.push(arg[1]);
        } else {
            rawArgs.push(arg);
        }
    }

    return [rawArgs, transferable];
}


// Used to give each request a unique id
let requestIndex = 0;

export class ActorInstance {
    private readonly requests: Map<number, [Function, Function]>;
    private readonly instanceId: number;
    private readonly worker: Worker;

    constructor(instanceId: number, worker: Worker) {
        this.instanceId = instanceId;
        this.worker = worker;
        this.requests = new Map();

        // Listen to incoming messages
        worker.addEventListener('message', ev => {
            const data = ev.data as (WorkerInstantiationReply | WorkerFunctionCallReply);

            // Check whenever the request is a function-call return value
            if (data.type === 'call') {
                const {ok, value, requestId} = data;

                // Validate response id
                if (!this.requests.has(requestId)) {
                    throw new Error(`No such request with id ${requestId}`);
                }

                const [resolve, reject] = this.requests.get(requestId) as [Function, Function];


                // Resolve or reject with given value
                ok ? resolve(value) : reject(value);

                // Clean up
                this.requests.delete(requestId);
            }
        });
    }

    /**
     * Calls a function on the class-instance in the worker.
     * @param fn
     * @param args
     */
    public async call(fn: string, ...args: Array<unknown>): Promise<unknown> {
        return new Promise((resolve, reject) => {
            const [rawArgs, transferable] = resolveArguments(args);
            const id = requestIndex++;

            // Send data to worker
            this.worker.postMessage({
                type: 'call',
                args: rawArgs,
                target: this.instanceId,
                requestId: id,
                functionName: fn
            } as WorkerFunctionCall, transferable);

            // Save resolver
            this.requests.set(id, [resolve, reject]);
        });
    }

    /**
     * Calls a function without expecting or returning its return-value.
     * It's faster than call since no promise needs to be fulfilled.
     */
    public commit(fn: string, ...args: Array<unknown>): void {
        const [rawArgs, transferable] = resolveArguments(args);

        // Send data to worker
        this.worker.postMessage({
            type: 'call',
            args: rawArgs,
            target: this.instanceId,
            requestId: null,
            functionName: fn
        } as WorkerFunctionCall, transferable);
    }
}

/**
 * A actor represents a worker containing one or more classes decorated with
 * actor.
 */
export class Actor {
    private readonly requests: Map<number, [Function, Function]>;
    private readonly worker: Worker;

    /**
     * Wraps a worker into an actor
     * @param worker The target worker to be wrapped
     */
    public constructor(worker: Worker) {
        this.worker = worker;
        this.requests = new Map();

        // Listen to incoming messages
        worker.addEventListener('message', ev => {
            const data = ev.data as (WorkerInstantiationReply | WorkerFunctionCallReply);

            // Check whenever the request is related to an instantiation
            if (data.type === 'instantiation') {
                const {instanceId, requestId} = data;

                // Validate response id
                if (!this.requests.has(requestId)) {
                    throw new Error(`No such request with id ${requestId}`);
                }

                const [resolve] = this.requests.get(requestId) as [Function, Function];

                // Resolve with new actor instance
                resolve(new ActorInstance(instanceId, worker));

                // Clean up
                this.requests.delete(data.requestId);
            }
        });
    }

    /**
     * Creates a new instance of a class living inside of the worker
     * @param name The classname
     * @param args Optional arguments passed to the factory-function or constructor
     */
    public async create(name: string, ...args: Array<unknown>): Promise<ActorInstance> {
        return new Promise((resolve, reject) => {
            const [rawArgs, transferable] = resolveArguments(args);
            const id = requestIndex++;

            // Send data to worker
            this.worker.postMessage({
                type: 'instantiation',
                args: rawArgs,
                requestId: id,
                name
            } as WorkerInstantiation, transferable);

            // Save resolver
            this.requests.set(id, [resolve, reject]);
        });
    }
}
