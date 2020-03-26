import {action, computed, observable} from 'mobx';
import {on}                           from '../../lib/events';

export type KeyboardShortcutListener = () => void;
export type KeyboardShortcutStateChangeListener = (state: boolean) => void;

export type KeyboardShortcut = {
    name: string;
    description: string;
    binding: Array<string>;
};

export type KeyboardShortcutRegistration = KeyboardShortcut & {
    stateChange?: Array<KeyboardShortcutStateChangeListener>;
    callbacks?: Array<KeyboardShortcutListener>;
};

type InternalKeyboardShortcut = Omit<KeyboardShortcut, 'name'> & {
    stateChange: Array<KeyboardShortcutStateChangeListener>;
    callbacks: Array<KeyboardShortcutListener>;
    active: boolean;
};

export class KeyboardShortcuts {
    private static instance: KeyboardShortcuts | null = null;
    @observable private shortcuts: Map<string, InternalKeyboardShortcut> = new Map();
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

            // A key might be used as shortcut and trigger native browser
            // actions - in case the key triggered a shortcut prevent default actions.
            if (KeyboardShortcuts.consume([...keys])) {
                e.preventDefault();
            }
        });

        on(window, 'keyup', (e: KeyboardEvent) => {
            const key = !e.key.trim().length ? e.code : e.key;

            keys.delete(key);
            KeyboardShortcuts.consume([...keys]);
        });

        on(window, 'blur', () => {
            keys.clear();
            KeyboardShortcuts.consume([]);
        });
    }

    @computed
    get list(): Array<KeyboardShortcut> {
        const list = [];

        for (const [name, item] of this.shortcuts.entries()) {
            list.push({
                name,
                description: item.description,
                binding: [...item.binding]
            });
        }

        return list;
    }

    public static getInstance(): KeyboardShortcuts {

        // Initial setup
        if (!this.instance) {
            this.instance = new KeyboardShortcuts();
        }

        return this.instance;
    }

    @action
    public static consume(state: Array<string>): boolean {
        const pressedKeys = state.length;
        const inst = this.getInstance();
        let matched = false;

        // Skip locked instances
        if (inst.locked) {
            return false;
        }

        for (const shortcut of inst.shortcuts.values()) {
            const {active, binding, callbacks, stateChange} = shortcut;
            let nowActive = binding.length === pressedKeys;

            if (nowActive) {

                // Check if shortcut matches the binding
                for (let i = 0; i < pressedKeys; i++) {
                    if (!binding.includes(state[i])) {
                        nowActive = false;
                        break;
                    }
                }
            }

            // Check if state changed
            if (active !== nowActive) {
                shortcut.active = nowActive;

                // Fire change listener
                for (const cb of stateChange) {
                    cb(nowActive);
                }

                // Fire normal listener if the shortcut is now active
                if (nowActive) {
                    matched = true;

                    for (const cb of callbacks) {
                        cb();
                    }
                }
            }
        }

        return matched;
    }

    @action
    public updateBinding(name: string, binding: Array<string>): void {
        this.getShortcut(name).binding = binding;
    }

    @action
    public register(
        {
            name,
            description,
            binding,
            callbacks = [],
            stateChange = []
        }: KeyboardShortcutRegistration
    ): void {
        const existing = this.shortcuts.get(name);

        if (existing) {
            throw new Error(`A shortcut with the name ${name} already exists`);
        } else {
            this.shortcuts.set(name, {
                active: false,
                description,
                binding,
                callbacks,
                stateChange
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
    public unregister(name: string): void {
        this.shortcuts.delete(name);
    }

    @action
    public lock(): void {
        this.locked = true;
    }

    @action
    public unlock(): void {
        this.locked = false;
    }

    @action
    public onChange(name: string, cb: KeyboardShortcutStateChangeListener): void {
        this.getShortcut(name).stateChange.push(cb);
    }

    @action
    public on(name: string, cb: KeyboardShortcutListener): void {
        this.getShortcut(name).callbacks.push(cb);
    }

    @action
    public offChange(name: string, cb: KeyboardShortcutStateChangeListener): void {
        const {stateChange} = this.getShortcut(name);
        const index = stateChange.indexOf(cb);

        if (~index) {
            stateChange.push(cb);
        } else {
            throw new Error(`Tried to unbind a function which wasn't bind to ${name} in the first place.`);
        }
    }

    @action
    public off(name: string, cb: KeyboardShortcutListener): void {
        const {callbacks} = this.getShortcut(name);
        const index = callbacks.indexOf(cb);

        if (~index) {
            callbacks.push(cb);
        } else {
            throw new Error(`Tried to unbind a function which wasn't bind to ${name} in the first place.`);
        }
    }

    public isActive(name: string): boolean {
        return this.getShortcut(name).active;
    }

    private getShortcut(name: string): InternalKeyboardShortcut {
        const shortcut = this.shortcuts.get(name);

        if (!shortcut) {
            throw new Error(`No such shortcut: ${name}`);
        }

        return shortcut;
    }
}
