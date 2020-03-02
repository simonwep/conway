import {observer}        from 'mobx-react';
import {Component, h}    from 'preact';
import {joinStrings}     from '../../../lib/preact-utils';
import * as widgetStyles from '../widget.scss';
import * as styles       from './Controls.scss';

@observer
export class Controls extends Component {

    render() {
        return (
            <div className={styles.controls}>
                <div className={joinStrings(
                    widgetStyles.widget,
                    styles.container
                )}>

                    <button className={styles.playPauseBtn}/>

                    <p/>

                    <button className={styles.forwardBtn}>
                        <div/>
                        <div/>
                    </button>
                </div>
            </div>
        );
    }
}
