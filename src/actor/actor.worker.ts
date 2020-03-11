import {WorkerFunctionCall, WorkerFunctionCallReply, WorkerInstantiation, WorkerInstantiationReply} from './actor.main';

type RegisteredClass = {
    constructor: Function;
    instantiationFunction?: string;
};

// Class instances and counter
const instances = new Map<number, any>();
let instanceIndex = 0;

// Registered classes
const classes = new Map<string, RegisteredClass>();

// Listen for messages
self.addEventListener('message', async ev => {
    const data = ev.data as (WorkerInstantiation | WorkerFunctionCall);

    switch (data.type) {
        case 'call': {
            const {id, fn, target, args} = data;

            // Validate call-target
            if (!instances.has(target)) {
                throw new Error('Target instance ot found.');
            }

            try {
                self.postMessage({
                    type: 'call',
                    id,
                    ok: true,
                    value: await instances.get(target)[fn](...args)
                } as WorkerFunctionCallReply);
            } catch (e) {
                self.postMessage({
                    type: 'call',
                    id,
                    ok: false,
                    value: e.message
                } as WorkerFunctionCallReply);
            }

            break;
        }
        case 'instantiation': {
            const {id, name, args} = data;

            // Lookup name
            if (!classes.has(name)) {
                throw new Error(`No such class: ${name}`);
            }

            // Try to create an instance
            const {constructor, instantiationFunction} = classes.get(name) as RegisteredClass;
            const instance = instantiationFunction ?
                await (constructor as any)[instantiationFunction](...args) :
                new (constructor as any)(...args);

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
                id,
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
export function actor(instantiationFunction?: string) {
    return (constructor: Function) => {

        // Save class
        classes.set(constructor.name, {
            constructor,
            instantiationFunction
        });
    };
}
