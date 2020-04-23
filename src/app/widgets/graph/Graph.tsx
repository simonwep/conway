import {observer}                from 'mobx-react';
import {Component, createRef, h} from 'preact';
import {JSXInternal}             from 'preact/src/jsx';
import {cn}                      from '../../../lib/preact-utils';
import {life}                    from '../../../store';
import * as widgetStyles         from '../widget.module.scss';
import * as styles               from './Graph.module.scss';
import Element = JSXInternal.Element;

@observer
export class Graph extends Component {
    private canvas = createRef<HTMLCanvasElement>();

    componentDidMount(): void {
        const canvas = (this.canvas.current as HTMLCanvasElement);
        const offscreenCanvas = canvas.transferControlToOffscreen();

        life.registerGraphicCanvas(
            offscreenCanvas,
            canvas.getBoundingClientRect()
        );
    }

    render(): Element {
        return (
            <div className={cn(
                widgetStyles.widget,
                styles.graph
            )}>
                <canvas ref={this.canvas} height={182} width={381}/>
            </div>
        );
    }
}
