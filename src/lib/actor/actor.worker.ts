import {WorkerFunctionCall, WorkerFunctionCallReply, WorkerInstantiation, WorkerInstantiationReply} from './actor.main';

// Tell TS that we're in a worker
declare let self: DedicatedWorkerGlobalScope;

/* eslint-disable @typescript-eslint/no-explicit-any */
type RegisteredClass = {
    constructor: any;
    instantiationFunction?: string;
};

// Class instances and counter
/* eslint-disable @typescript-eslint/no-explicit-any */
const instances = new Map<number, any>();
let instanceIndex = 0;

// Registered classes
const classes = new Map<string, RegisteredClass>();

// Listen for messages
self.addEventListener('message', async ev => {
    const data = ev.data as (WorkerInstantiation | WorkerFunctionCall);

    switch (data.type) {
        case 'call': {
            const {requestId, functionName, target, args} = data;

            // Validate call-target
            if (!instances.has(target)) {
                throw new Error('Target instance ot found.');
            }

            // If the response is ignored (eg. commit has be used), ignore the promise
            if (requestId === null) {
                instances.get(target)[functionName](...args);
                break;
            }

            try {
                self.postMessage({
                    type: 'call',
                    requestId,
                    ok: true,
                    value: await instances.get(target)[functionName](...args)
                } as WorkerFunctionCallReply);
            } catch (e) {
                self.postMessage({
                    type: 'call',
                    requestId,
                    ok: false,
                    value: e.message
                } as WorkerFunctionCallReply);
            }

            break;
        }
        case 'instantiation': {
            const {requestId, name, args} = data;

            // Lookup name
            if (!classes.has(name)) {
                throw new Error(`No such class: ${name}`);
            }

            // Try to create an instance
            // TODO: This is blocking!
            const {constructor, instantiationFunction} = classes.get(name) as RegisteredClass;
            const instance = instantiationFunction ?
                await constructor[instantiationFunction](...args) :
                new constructor(...args);

            // Check whenever the instance represents an actual class-instance
            if (!(instance instanceof constructor)) {
                throw new Error(`Instantiation of class ${name} failed.`);
            }

            // Save instance
            const instanceId = instanceIndex++;
            instances.set(instanceId, instance);

            // Return id of instance
            self.postMessage({
                type: 'instantiation',
                requestId,
                instanceId
            } as WorkerInstantiationReply);
        }
    }
});


/**
 * Registers a class inside of an worker as actor.
 * This class can be instantiated and used over the main-thread.
 * @param instantiationFunction Function used to create an instance.
 */
export function actor(instantiationFunction?: string): (c: Function) => void {
    return (constructor: Function): void => {

        // Save class
        classes.set(constructor.name, {
            constructor,
            instantiationFunction
        });
    };
}
