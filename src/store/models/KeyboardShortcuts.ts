import {action, computed, observable} from 'mobx';
import {on}                           from '../../lib/dom-events';

export type KeyboardShortcutListener = () => void;

export type KeyboardShortcut = {
    name: string;
    description: string;
    binding: Array<string>;
};

export type KeyboardShortcutRegistration = KeyboardShortcut & {
    callbacks?: Array<KeyboardShortcutListener>;
};

type InternalKeyboardShortcut = KeyboardShortcut & {
    callbacks: Array<KeyboardShortcutListener>;
};

export class KeyboardShortcuts {
    private static instance: KeyboardShortcuts | null = null;
    @observable private listeners: Array<InternalKeyboardShortcut> = [];
    @observable private locked = false;

    private constructor() {
        const keys = new Set<string>();

        on(window, 'keydown', (e: KeyboardEvent) => {
            const key = !e.key.trim().length ? e.code : e.key;

            // Block default browser shortcuts
            if (key === 'Control' || key === '+' || key === '-') {
                e.preventDefault();
            }

            keys.add(key);
            KeyboardShortcuts.consume([...keys]);
        });

        on(window, 'keyup', (e: KeyboardEvent) => keys.delete(e.key));
        on(window, 'blur', () => keys.clear());
    }

    @computed
    get list(): Array<KeyboardShortcut> {
        return this.listeners.map(value => ({
            name: value.name,
            description: value.description,
            binding: [...value.binding]
        }));
    }

    public static getInstance(): KeyboardShortcuts {

        // Initial setup
        if (!this.instance) {
            this.instance = new KeyboardShortcuts();
        }

        return this.instance;
    }

    @action
    public static consume(state: Array<string>): void {
        const pressedKeys = state.length;
        const inst = this.getInstance();

        // Skip locked instances
        if (inst.locked) {
            return;
        }

        listeners: for (const {binding, callbacks} of inst.listeners) {

            if (binding.length === pressedKeys) {

                // Check if shortcut matches the binding
                for (let i = 0; i < pressedKeys; i++) {
                    if (!binding.includes(state[i])) {
                        continue listeners;
                    }
                }

                // Fire listener
                for (const cb of callbacks) {
                    cb();
                }
            }
        }
    }


    @action
    public updateBinding(name: string, binding: Array<string>): void {
        const shortcut = this.listeners.find(value => value.name === name);

        if (!shortcut) {
            throw new Error(`No such shortcut: ${name}`);
        }

        shortcut.binding = binding;
    }

    @action
    public register(
        {
            name,
            description,
            binding,
            callbacks = []
        }: KeyboardShortcutRegistration
    ): void {
        const existing = this.listeners.find(value => value.name === name);

        if (existing) {
            Object.assign(existing, {
                description,
                binding,
                callbacks: existing.callbacks.concat(callbacks)
            });
        } else {
            this.listeners.push({
                name,
                description,
                binding,
                callbacks
            });
        }
    }

    @action
    public registerAll(registrations: Array<KeyboardShortcutRegistration>): void {
        for (const reg of registrations) {
            this.register(reg);
        }
    }

    @action
    public unregister(shortcut: number | string): void {
        let index;

        if (typeof shortcut === 'string') {
            index = this.listeners.findIndex(v => v.name === shortcut);
        } else {
            index = shortcut;
        }

        if (index < 0 || index > this.listeners.length) {
            throw new Error(`Invalid shortcut index ${index}`);
        }

        this.listeners.splice(index, 1);
    }

    @action
    public lock(): void {
        this.locked = true;
    }

    @action
    public unlock(): void {
        this.locked = false;
    }
}
