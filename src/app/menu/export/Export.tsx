import {observer}     from 'mobx-react';
import {Component, h} from 'preact';
import {JSXInternal}  from 'preact/src/jsx';
import {bind}         from '../../../lib/preact-utils';
import {life}         from '../../../store';
import Icon           from '../../components/Icon';
import styles         from './Export.module.scss';
import Element = JSXInternal.Element;

@observer
export class Export extends Component {

    @bind
    downloadAsSVG(): void {
        life.downloadAsSVG();
    }

    render(): Element {

        return (
            <div className={styles.export}>
                <section>
                    <h2>As SVG</h2>
                    <p>Export the current state as pixel-perfect svg image.</p>
                    <button onClick={this.downloadAsSVG}>
                        <Icon name="download"/>
                        <p>Download</p>
                    </button>
                </section>
            </div>
        );
    }
}
