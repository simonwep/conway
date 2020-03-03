import {observer}        from 'mobx-react';
import {Component, h}    from 'preact';
import {joinStrings}     from '../../../lib/preact-utils';
import {life}            from '../../../store';
import * as widgetStyles from '../widget.module.scss';
import * as styles       from './LifeStats.module.scss';

@observer
export class LifeStats extends Component {

    render() {

        return (
            <div className={joinStrings(
                widgetStyles.widget,
                styles.lifeStats
            )}>
                <p>{life.fps} FPS</p>
                <p>{life.generation}th Generation</p>
            </div>
        );
    }
}
