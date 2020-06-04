import {action}       from 'mobx';
import {observer}     from 'mobx-react';
import {Component, h} from 'preact';
import {JSXInternal}  from 'preact/src/jsx';
import {bind}         from '../../../lib/preact-utils';
import {life}         from '../../../store';
import {FPSLimiter}   from './FPSLimiter';
import * as styles    from './LifeStats.module.scss';
import {Stats}        from './Stats';

@observer
export class LifeStats extends Component {

    @bind
    @action
    resetGenerationCounter(): void {
        life.offsetGenerationCounter();
    }

    render(): JSXInternal.Element {
        return (
            <div className={styles.lifeStats}>
                <FPSLimiter/>
                <Stats/>
            </div>
        );
    }
}
