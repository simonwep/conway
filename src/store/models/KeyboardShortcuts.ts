import {action, computed, observable} from 'mobx';
import {on}                           from '../../lib/dom-events';

export type KeyboardShortcutListener = () => void;

export type KeyboardShortcut = {
    name: string;
    description: string;
    binding: Array<string>;
};

type InternalKeyboardShortcut = KeyboardShortcut & {
    callbacks: Array<KeyboardShortcutListener>;
};

export class KeyboardShortcuts {
    private static instances: Array<KeyboardShortcuts> = [];
    @observable private listeners: Array<InternalKeyboardShortcut> = [];

    constructor() {
        KeyboardShortcuts.instances.push(this);
    }

    @computed
    get list(): Array<KeyboardShortcut> {
        return this.listeners.map(value => ({
            name: value.name,
            description: value.description,
            binding: [...value.binding]
        }));
    }

    @action
    public static consume(state: Array<string>): void {
        const pressedKeys = state.length;

        for (const inst of KeyboardShortcuts.instances) {
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
    public register(name: string, description: string, binding: Array<string>, ...callbacks: Array<KeyboardShortcutListener>): void {
        this.listeners.push({
            name,
            description,
            binding,
            callbacks
        });
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
}

const keys = new Set<string>();

on(window, 'keydown', (e: KeyboardEvent) => {
    keys.add(e.code);
    KeyboardShortcuts.consume([...keys]);
});

on(window, 'keyup', (e: KeyboardEvent) => keys.delete(e.code));
on(window, 'blur', () => keys.clear());
