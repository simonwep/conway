import {observer}        from 'mobx-react';
import {Component, h}    from 'preact';
import {JSXInternal}     from 'preact/src/jsx';
import {bind, cn}        from '../../../lib/preact-utils';
import {life}            from '../../../store';
import * as widgetStyles from '../widget.module.scss';
import * as styles       from './FPSLimiter.module.scss';
import Element = JSXInternal.Element;

@observer
export class FPSLimiter extends Component {

    @bind
    increaseLimit(e: MouseEvent): void {
        this.updateLimit(e, false);
    }

    @bind
    decreaseLimit(e: MouseEvent): void {
        this.updateLimit(e, true);
    }

    @bind
    handleWheelEvent(e: WheelEvent): void {
        if (e.deltaY < 0) {
            this.increaseLimit(e);
        } else {
            this.decreaseLimit(e);
        }

        e.preventDefault();
    }

    @bind
    updateLimit(event: MouseEvent, negative: boolean): void {
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

    render(): Element {
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
