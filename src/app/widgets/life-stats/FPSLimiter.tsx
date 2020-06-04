import {observer}                from 'mobx-react';
import {Component, createRef, h} from 'preact';
import {JSXInternal}             from 'preact/src/jsx';
import {bind}                    from '../../../lib/preact-utils';
import {life, shortcuts}         from '../../../store';
import {VerticalNumberInput}     from '../../components/VerticalNumberInput';

@observer
export class FPSLimiter extends Component {
    private input = createRef<VerticalNumberInput>();

    constructor() {
        super();

        // TODO: Improve API
        shortcuts.register([
            {
                name: 'lock-unlock-fps',
                description: 'Toggle FPS-lock',
                binding: ['L'],
                callbacks: [(): void => {
                    life.setFPSLimitation(
                        life.fpsLimitation === null ? 30 : null
                    );
                }]
            },
            {
                name: 'increase-lock-fps',
                description: 'Increase locked FPS',
                binding: ['SHIFT', 'O'],
                callbacks: [(): void => this.input.current?.increaseLimit()]
            },
            {
                name: 'decrease-lock-fps',
                description: 'Decrease locked FPS',
                binding: ['SHIFT', 'L'],
                callbacks: [(): void => this.input.current?.decreaseLimit()]
            }
        ]);
    }

    @bind
    onChange(value: number): null | void {
        life.setFPSLimitation(value);
    }

    render(): JSXInternal.Element {
        const {fpsLimitation} = life;

        return (
            <VerticalNumberInput
                min={1}
                baseValue={30}
                ref={this.input}
                onChange={this.onChange}
                useValue={fpsLimitation}
            />
        );
    }
}
