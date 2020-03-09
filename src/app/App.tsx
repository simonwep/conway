import {Component, h}   from 'preact';
import {bind}           from '../lib/preact-utils';
import {LoadingOverlay} from './LoadingOverlay';
import {Controls}       from './widgets/controls/Controls';
import {Graph}          from './widgets/graph/Graph';
import {LifeStats}      from './widgets/life-stats/LifeStats';
import {Rules}          from './widgets/rules/Rules';

type Props = {};
type State = {
    canvasInitialized: boolean;
};

export class App extends Component<Props, State> {

    state = {
        canvasInitialized: false
    };

    @bind
    onLoaded() {
        this.setState({
            ...this.state,
            canvasInitialized: true
        });
    }

    render(_: Props, {canvasInitialized}: State) {
        return (
            <div>
                <LifeStats/>
                <Controls/>
                <Rules/>
                <Graph/>
                {!canvasInitialized ? <LoadingOverlay onLoaded={this.onLoaded}/> : ''}
            </div>
        );
    }
}
