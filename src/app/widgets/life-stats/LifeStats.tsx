import {observer}        from 'mobx-react';
import {Component, h}    from 'preact';
import {joinStrings}     from '../../../lib/preact-utils';
import {life}            from '../../../store';
import * as widgetStyles from '../widget.scss';
import * as styles       from './LifeStats.scss';

@observer
export class LifeStats extends Component {

    render() {

        return (
            <div class={joinStrings(
                widgetStyles.widget,
                styles.lifeStats
            )}>
                <p>{life.fps} FPS</p>
                <p>{life.generation}th Generation</p>
            </div>
        );
    }
}
