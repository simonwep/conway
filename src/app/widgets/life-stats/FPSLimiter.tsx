import {observer}        from 'mobx-react';
import {Component, h}    from 'preact';
import {bind, cn}        from '../../../lib/preact-utils';
import {life}            from '../../../store';
import * as widgetStyles from '../widget.module.scss';
import * as styles       from './FPSLimiter.module.scss';

@observer
export class FPSLimiter extends Component {

    @bind
    increaseLimit(e: MouseEvent) {
        this.updateLimit(e, false);
    }

    @bind
    decreaseLimit(e: MouseEvent) {
        this.updateLimit(e, true);
    }

    @bind
    handleWheelEvent(e: WheelEvent) {
        if (e.deltaY < 0) {
            this.increaseLimit(e);
        } else {
            this.decreaseLimit(e);
        }
    }

    @bind
    updateLimit(event: MouseEvent, negative: boolean) {
        const {fpsLimitation} = life;

        if (fpsLimitation === null) {
            return;
        }

        life.setFPSLimitation(
            Math.max(
                1,
                fpsLimitation + (
                    event.ctrlKey || event.ctrlKey ? 10 :
                        event.shiftKey ? 5 : 1
                ) * (negative ? -1 : 1)
            )
        );
    }

    render() {
        const {fpsLimitation} = life;

        // TODO: Show whenever the fps-limit has been met or not
        return (
            <div className={cn(
                widgetStyles.widget,
                styles.fpsLimiter,
                {[widgetStyles.disabled]: fpsLimitation === null}
            )} onWheel={this.handleWheelEvent}>
                <button className={styles.arrowUp} onClick={this.increaseLimit}/>
                <p>{fpsLimitation === null ? '-' : fpsLimitation}</p>
                <button className={styles.arrowDown} onClick={this.decreaseLimit}/>
            </div>
        );
    }
}
