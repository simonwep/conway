import {Component, h}   from 'preact';
import {JSXInternal}    from 'preact/src/jsx';
import {bind, cn}       from '../lib/preact-utils';
import {shortcuts}      from '../store';
import styles           from './App.module.scss';
import {LoadingOverlay} from './LoadingOverlay';
import {Menu}           from './menu/Menu';
import {CellSize}       from './widgets/cell-size/CellSize';
import {Controls}       from './widgets/controls/Controls';
import {Graph}          from './widgets/graph/Graph';
import {LifeStats}      from './widgets/life-stats/LifeStats';
import {Rules}          from './widgets/rules/Rules';

type Props = {};
type State = {
    canvasInitialized: boolean;
    hideUI: boolean;
};

export class App extends Component<Props, State> {

    state = {
        canvasInitialized: false,
        hideUI: false
    };

    constructor() {
        super();
        shortcuts.register({
            name: 'toggle-ui',
            description: 'Hide / Show the UI',
            binding: ['F1'],
            callbacks: [this.toggleUI]
        });
    }

    @bind
    onLoaded(): void {
        this.setState({
            canvasInitialized: true
        });
    }

    @bind
    toggleUI(): void {
        this.setState({
            hideUI: !this.state.hideUI
        });
    }

    render(_: Props, {canvasInitialized, hideUI}: State): JSXInternal.Element {
        return canvasInitialized ? (
            <div>
                <div className={cn(styles.contentWrapper, {
                    [styles.hidden]: hideUI
                })}>
                    <LifeStats/>
                    <Controls/>
                    <Rules/>
                    <Graph/>
                    <CellSize/>
                </div>
                <Menu/>
            </div>
        ) : <LoadingOverlay onLoaded={this.onLoaded}/>;
    }
}
