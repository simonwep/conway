import {Component, h}   from 'preact';
import {JSXInternal}    from 'preact/src/jsx';
import {bind}           from '../lib/preact-utils';
import {LoadingOverlay} from './LoadingOverlay';
import {Menu}           from './menu/Menu';
import {CellSize}       from './widgets/cell-size/CellSize';
import {Controls}       from './widgets/controls/Controls';
import {Graph}          from './widgets/graph/Graph';
import {LifeStats}      from './widgets/life-stats/LifeStats';
import {Rules}          from './widgets/rules/Rules';
import Element = JSXInternal.Element;

type Props = {};
type State = {
    canvasInitialized: boolean;
};

export class App extends Component<Props, State> {

    state = {
        canvasInitialized: false
    };

    @bind
    onLoaded(): void {
        this.setState({
            ...this.state,
            canvasInitialized: true
        });
    }

    render(_: Props, {canvasInitialized}: State): Element {
        return (
            <div>
                <LifeStats/>
                <Controls/>
                <Rules/>
                <Graph/>
                <CellSize/>
                <Menu/>
                {!canvasInitialized ? <LoadingOverlay onLoaded={this.onLoaded}/> : ''}
            </div>
        );
    }
}
