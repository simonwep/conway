import {observer}                           from 'mobx-react';
import {Component, createRef, h, RefObject} from 'preact';
import {JSXInternal}                        from 'preact/src/jsx';
import {bind}                               from '../../../lib/preact-utils';
import {life}                               from '../../../store';
import Icon                                 from '../../components/Icon';
import styles                               from './Export.module.scss';
import Element = JSXInternal.Element;

@observer
export class Export extends Component {
    private readonly exportRuleSet: RefObject<CheckBoxElement>;

    constructor() {
        super();
        this.exportRuleSet = createRef();
    }


    @bind
    downloadAsSVG(): void {
        life.downloadAsSVG();
    }

    @bind
    downloadAsLifeBin(): void {
        const exportRuleset = this.exportRuleSet.current?.checked;
        life.downloadAsLBin(exportRuleset);
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

                <section>
                    <h2>As LBIN</h2>
                    <p>Export as <code>.clife</code>-file.<br/>This file can be imported any time by dragging it onto the screen.</p>


                    <div className={styles.downloadSection}>
                        <div className={styles.option}>
                            <check-box checked="true" ref={this.exportRuleSet}/>
                            <p>Include ruleset</p>
                        </div>

                        <button onClick={this.downloadAsLifeBin}>
                            <Icon name="download"/>
                            <p>Download</p>
                        </button>
                    </div>
                </section>
            </div>
        );
    }
}
