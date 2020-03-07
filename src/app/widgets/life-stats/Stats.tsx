import {observer}        from 'mobx-react';
import {Component, h}    from 'preact';
import {bind, cn}        from '../../../lib/preact-utils';
import {life}            from '../../../store';
import Icon              from '../../components/Icon';
import * as widgetStyles from '../widget.module.scss';
import * as styles       from './Stats.module.scss';

@observer
export class Stats extends Component {

    @bind
    resetGenerationCounter() {
        life.offsetGenerationCounter();
    }

    @bind
    toggleFramerateLimiter() {
        life.setFPSLimitation(life.fpsLimitation === null ? 30 : null);
    }

    render() {
        const {fpsLimitation} = life;

        return (
            <div className={cn(
                widgetStyles.widget,
                styles.stats
            )}>
                <section>
                    <button className={cn(
                        styles.lockFPSBtn,
                        {[styles.active]: fpsLimitation !== null}
                    )}
                            onClick={this.toggleFramerateLimiter}>
                        <Icon name="lock"/>
                    </button>
                    <p>{life.fps} FPS</p>
                </section>

                <section>
                    <button className={styles.resetGenerationCounterBtn}
                            onClick={this.resetGenerationCounter}>
                        <Icon name="reset"/>
                    </button>
                    <p>{life.generationCount}th Generation</p>
                </section>
            </div>
        );
    }
}
