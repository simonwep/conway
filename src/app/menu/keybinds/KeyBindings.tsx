import {observer}     from 'mobx-react';
import {Component, h} from 'preact';
import {JSXInternal}  from 'preact/src/jsx';
import {shortcuts}    from '../../../store';
import {KeyBinding}   from './KeyBinding';
import styles         from './KeyBindings.module.scss';
import Element = JSXInternal.Element;

@observer
export class KeyBindings extends Component {
    render(): Element {
        const {list} = shortcuts;

        return (
            <div className={styles.keyBindings}>
                {
                    list.map((value, index) => {
                        return <KeyBinding key={index} id={index} shortcut={value}/>;
                    })
                }
            </div>
        );
    }
}
