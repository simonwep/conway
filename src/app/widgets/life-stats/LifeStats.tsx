import {action}       from 'mobx';
import {observer}     from 'mobx-react';
import {Component, h} from 'preact';
import {bind}         from '../../../lib/preact-utils';
import {life}         from '../../../store';
import {FPSLimiter}   from './FPSLimiter';
import * as styles    from './LifeStats.module.scss';
import {Stats}        from './Stats';

type Props = unknown;
type State = {
    fpsLimiterEnabled: boolean;
};

@observer
export class LifeStats extends Component<State, Props> {

    @bind
    @action
    resetGenerationCounter() {
        life.offsetGenerationCounter();
    }

    render() {

        return (
            <div className={styles.lifeStats}>
                <FPSLimiter/>
                <Stats/>
            </div>
        );
    }
}
