import {observer}                from 'mobx-react';
import {Component, createRef, h} from 'preact';
import {transfer}                from '../../../actor/actor.main';
import {getEngine}               from '../../../engine';
import {cn}                      from '../../../lib/preact-utils';
import * as widgetStyles         from '../widget.module.scss';
import * as styles               from './Graph.module.scss';

@observer
export class Graph extends Component {
    private canvas = createRef<HTMLCanvasElement>();

    componentDidMount(): void {
        const offscreenCanvas = (this.canvas.current as HTMLCanvasElement).transferControlToOffscreen();

        getEngine().then(engine => {
            return engine.call('setGraphCanvas', transfer(offscreenCanvas));
        });
    }

    render() {
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
