import {observer}        from 'mobx-react';
import {Component, h}    from 'preact';
import {JSXInternal}     from 'preact/src/jsx';
import {bind, cn}        from '../../../lib/preact-utils';
import {life}            from '../../../store';
import * as widgetStyles from '../widget.module.scss';
import * as styles       from './Controls.module.scss';
import Element = JSXInternal.Element;

type Props = {};
type State = {
    paused: boolean; // TODO: Move to store
};

@observer
export class Controls extends Component<Props, State> {

    state = {
        paused: false
    };

    @bind
    toggleRunState(): void {
        const {paused} = this.state;

        if (paused) {
            life.play();
        } else {
            life.pause();
        }

        this.setState({
            ...this.state,
            paused: !paused
        });
    }

    @bind
    nextGeneration(): void {
        life.nextGeneration();
    }

    render(): Element {

        // TODO: Render gets called without args?
        const {paused} = this.state;

        return (
            <div className={styles.controls}>
                <div className={cn(
                    widgetStyles.widget,
                    styles.container
                )}>

                    <button className={styles.playPauseBtn}
                            data-state={paused ? 'playing' : 'paused'}
                            onClick={this.toggleRunState}/>
                    <p/>

                    <button className={styles.forwardBtn}
                            data-state={paused ? 'enabled' : 'disabled'}
                            onClick={this.nextGeneration}>
                        <div/>
                        <div/>
                    </button>
                </div>
            </div>
        );
    }
}
