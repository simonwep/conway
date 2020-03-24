import {observer}     from 'mobx-react';
import {Component, h} from 'preact';
import {JSXInternal} from 'preact/src/jsx';
import styles        from './Appearance.module.scss';
import Element = JSXInternal.Element;

@observer
export class Appearance extends Component {
    render(): Element {

        return (
            <div className={styles.appearance}>
                <p>Themes...</p>
            </div>
        );
    }
}
