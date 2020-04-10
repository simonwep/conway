import {observer}                  from 'mobx-react';
import {Component, h}              from 'preact';
import {JSXInternal}               from 'preact/src/jsx';
import {eventPath}                 from '../../../lib/event-path';
import {EventBindingArgs, off, on} from '../../../lib/events';
import {bind, cn}                  from '../../../lib/preact-utils';
import {prettyKeyCode}             from '../../../lib/pretty-key-code';
import {shortcuts}                 from '../../../store';
import {KeyboardShortcut}          from '../../../store/models/KeyboardShortcuts';
import styles                      from './KeyBinding.module.scss';
import Element = JSXInternal.Element;

type Props = {
    id: number;
    shortcut: KeyboardShortcut;
};

type State = {
    recording: boolean;
    keyNames: Array<string>;
    listener: Array<EventBindingArgs>;
};

@observer
export class KeyBinding extends Component<Props, State> {
    state = {
        recording: false,
        keyNames: [] as Array<string>,
        listener: [] as Array<EventBindingArgs>
    };

    constructor(props: Props) {
        super();
        this.state.keyNames = props.shortcut.binding;
    }

    @bind
    toggleState(): void {
        const {recording} = this.state;
        let {listener} = this.state;

        if (recording) {
            shortcuts.unlock();

            // Unbind listeners
            for (const args of listener) {
                off(...args);
            }

            // Apply update
            shortcuts.updateBinding(
                this.props.shortcut.name,
                this.state.keyNames
            );
        } else {
            shortcuts.lock();
            let keyNamesCopy = [...this.state.keyNames];
            let init = true;

            // Bind listeners
            listener = [

                on(window, 'keydown', (e: KeyboardEvent) => {
                    const key = prettyKeyCode(e);

                    if (!keyNamesCopy.includes(key)) {
                        if (init) {
                            keyNamesCopy = [];
                        }

                        init = false;
                        keyNamesCopy.push(key);

                        this.setState({
                            keyNames: [...keyNamesCopy]
                        });
                    }

                    e.preventDefault();
                    e.stopImmediatePropagation();
                }),

                on(window, 'keyup', (e: KeyboardEvent) => {
                    const index = keyNamesCopy.indexOf(prettyKeyCode(e));

                    if (~index) {
                        keyNamesCopy.splice(index, 1);
                    }

                    e.preventDefault();
                    e.stopImmediatePropagation();
                }),

                // Cancel if user clicks somewhere else
                on(window, 'click', (e: MouseEvent) => {
                    const path = eventPath(e);

                    if (!path.includes(this.base as HTMLElement)) {
                        this.toggleState();
                    }
                }),

                // Cancel on focus lost
                on(window, 'blur', () => {
                    this.toggleState();
                })
            ];
        }

        this.setState({
            listener,
            recording: !recording
        });
    }

    render(): Element {
        const {recording, keyNames} = this.state;
        const {shortcut} = this.props;
        const keys = (recording ? keyNames : shortcut.binding).map(value => {

            // Prettify key-names
            return value.replace(/key/gi, '')
                .replace(/Control(left)?/gi, 'ctrl');
        }).map((value, index) => <span key={index}>{value}</span>);

        return (
            <div className={cn(styles.keyBinding, {
                [styles.recording]: recording
            })}>
                <p>{shortcut.description}</p>

                <div className={styles.keys}
                     onClick={this.toggleState}>
                    <span>{keys}</span>
                    <button>
                        {recording ? 'Update' : 'Edit Shortcut'}
                    </button>
                </div>
            </div>
        );
    }
}

