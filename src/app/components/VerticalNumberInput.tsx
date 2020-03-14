import {observer}        from 'mobx-react';
import {Component, h}    from 'preact';
import {JSXInternal}     from 'preact/src/jsx';
import {bind, cn}        from '../../lib/preact-utils';
import * as widgetStyles from '../widgets/widget.module.scss';
import * as styles       from './VerticalNumberInput.module.scss';
import Element = JSXInternal.Element;

type Props = {
    onChange: (nextValue: number) => number | boolean | null | void;
    increase: Element;
    decrease: Element;
    class: string;
    baseValue: number | null;
    useValue: number | null | undefined;
    min: number;
    max: number;
    step: number;
    wheelStep: number;
    shiftKey: number;
    ctrlKey: number;
};

type State = {
    value: number | null;

};

@observer
export class VerticalNumberInput extends Component<Props, State> {

    public static defaultProps = {
        increase: (<button className={styles.arrowUp}/>),
        decrease: (<button className={styles.arrowDown}/>),
        baseValue: 0,
        useValue: undefined,
        min: Number.MAX_SAFE_INTEGER,
        max: Number.MAX_SAFE_INTEGER,
        class: '',
        step: 1,
        wheelStep: 1,
        shiftKey: 5,
        ctrlKey: 10
    };

    state = {
        value: 0
    };

    @bind
    increaseLimit(e: MouseEvent): void {
        this.updateLimit(e, this.props.step);
    }

    @bind
    decreaseLimit(e: MouseEvent): void {
        this.updateLimit(e, -this.props.step);
    }

    @bind
    handleWheelEvent(e: WheelEvent): void {
        if (e.deltaY < 0) {
            this.updateLimit(e, this.props.wheelStep);
        } else {
            this.updateLimit(e, -this.props.wheelStep);
        }

        e.preventDefault();
    }

    @bind
    updateLimit(event: MouseEvent, value: number): void {
        const {ctrlKey, shiftKey} = event;
        const {state, props} = this;
        let next = state.value;

        if (ctrlKey) {
            next += value * props.ctrlKey;
        } else if (shiftKey) {
            next += value * props.shiftKey;
        } else {
            next += value;
        }

        // Clamp value
        next = Math.max(props.min, Math.min(props.max, next));

        // Emit event and process outcome
        const final = props.onChange(next);
        if (final === false) {
            return;
        } else if (typeof final === 'number') {
            next = final;
        }

        this.setState({
            ...state,
            value: next
        });
    }

    render(): Element {
        const {increase, decrease, useValue, shiftKey, ctrlKey, wheelStep, step, min, max} = this.props;
        const value = useValue === undefined ? this.state.value : useValue;
        const minChange = Math.min(shiftKey, ctrlKey, wheelStep, step);

        return (
            <div className={cn(
                this.props.class,
                widgetStyles.widget,
                styles.verticalNumberInput,
                {[widgetStyles.disabled]: value === null}
            )} onWheel={this.handleWheelEvent}>
                <div onClick={this.increaseLimit} className={cn({
                    [styles.disabled]: value !== null && (value + minChange) > max
                })}>{increase}</div>

                <p>{value === null ? '-' : value}</p>

                <div onClick={this.decreaseLimit} className={cn({
                    [styles.disabled]: value !== null && (value - minChange) < min
                })}>{decrease}</div>
            </div>
        );
    }
}
