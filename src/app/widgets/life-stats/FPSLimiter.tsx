import {observer}            from 'mobx-react';
import {Component, h}        from 'preact';
import {JSXInternal}         from 'preact/src/jsx';
import {bind}                from '../../../lib/preact-utils';
import {life}                from '../../../store';
import {VerticalNumberInput} from '../../components/VerticalNumberInput';
import Element = JSXInternal.Element;

@observer
export class FPSLimiter extends Component {

    @bind
    onChange(value: number): null | void {
        const {fpsLimitation} = life;

        if (fpsLimitation === null) {
            return null;
        }

        life.setFPSLimitation(value);
    }

    render(): Element {
        const {fpsLimitation} = life;

        return (
            <VerticalNumberInput
                min={1}
                baseValue={30}
                onChange={this.onChange}
                useValue={fpsLimitation}
            />
        );
    }
}
