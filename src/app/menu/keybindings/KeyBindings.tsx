import {observer}     from 'mobx-react';
import {Component, h} from 'preact';
import {JSXInternal}  from 'preact/src/jsx';
import {shortcuts}    from '../../../store';
import {KeyBinding}   from './KeyBinding';
import styles         from './KeyBindings.module.scss';

@observer
export class KeyBindings extends Component {
    render(): JSXInternal.Element {
        const {list} = shortcuts;

        return (
            <div className={styles.keyBindings}>

                <p className={styles.disableHint}>Shortcuts are disabled while this panel is visible.</p>

                <div className={styles.header}>
                    <h3>Action</h3>
                    <h3>Shortcut <small>(click to edit)</small></h3>
                </div>

                <div className={styles.list}>
                    {list.map((value, index) => {
                        return <KeyBinding key={index} id={index} shortcut={value}/>;
                    })}
                </div>
            </div>
        );
    }
}
