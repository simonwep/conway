import {observer}                from 'mobx-react';
import {Component, createRef, h} from 'preact';
import {JSXInternal}             from 'preact/src/jsx';
import {bind}                    from '../../../lib/preact-utils';
import {life}                    from '../../../store';
import Icon                      from '../../components/Icon';
import styles                    from './Export.module.scss';
import Element = JSXInternal.Element;

@observer
export class Export extends Component {
    private readonly prefersDarkTheme = matchMedia('(prefers-color-scheme: dark)').matches;

    private readonly lbinOptions = {
        fpsLock: createRef<CheckBoxElement>(),
        ruleSet: createRef<CheckBoxElement>(),
        generation: createRef<CheckBoxElement>()
    };

    private readonly svgOptions = {
        darkTheme: createRef<CheckBoxElement>()
    };


    @bind
    downloadAsSVG(): void {
        const darkTheme = this.svgOptions.darkTheme.current?.checked;
        life.exportAsSVG(!!darkTheme);
    }

    @bind
    downloadAsLifeBin(): void {
        life.exportAsLBin({
            ruleSet: !!this.lbinOptions.ruleSet.current?.checked,
            generation: !!this.lbinOptions.generation.current?.checked,
            fpsLock: !!this.lbinOptions.fpsLock.current?.checked
        });
    }

    render(): Element {

        return (
            <div className={styles.export}>
                <section>
                    <h2>As SVG</h2>
                    <p>Export the current state as pixel-perfect svg image.</p>

                    <div className={styles.downloadSection}>
                        <div className={styles.option}>
                            <check-box checked={this.prefersDarkTheme} ref={this.svgOptions.darkTheme}/>
                            <p>Dark theme</p>
                        </div>

                        <button onClick={this.downloadAsSVG}>
                            <Icon name="download"/>
                            <p>Download</p>
                        </button>
                    </div>
                </section>

                <section>
                    <h2>As LBIN</h2>
                    <p>Export as <code>.clife</code>-file.<br/>This file can be imported any time by dragging it onto the screen.</p>

                    <div className={styles.downloadSection}>
                        <div className={styles.option}>
                            <check-box checked="true" ref={this.lbinOptions.ruleSet}/>
                            <p>Include ruleset</p>
                        </div>

                        <div className={styles.option}>
                            <check-box checked="true" ref={this.lbinOptions.generation}/>
                            <p>Include generation</p>
                        </div>

                        {
                            life.fpsLimitation === null ? '' : (
                                <div className={styles.option}>
                                    <check-box checked="true" ref={this.lbinOptions.fpsLock}/>
                                    <p>Include FPS-Lock</p>
                                </div>
                            )
                        }

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
