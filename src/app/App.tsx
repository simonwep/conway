import {Component, h}   from 'preact';
import {init}           from '../controller';
import {LoadingOverlay} from './LoadingOverlay';
import {Controls}       from './widgets/controls/Controls';
import {LifeStats}      from './widgets/life-stats/LifeStats';


type Props = {};
type State = {
    canvasInitialized: boolean;
};

export class App extends Component<Props, State> {

    state = {
        canvasInitialized: false
    };

    componentDidMount(): void {

        // TODO: What about errors?
        init().then(() => {
            this.setState({
                ...this.state,
                canvasInitialized: true
            });
        });
    }

    render(_: Props, {canvasInitialized}: State) {
        return canvasInitialized ? (
            <div>
                <LifeStats/>
                <Controls/>
            </div>
        ) : (<LoadingOverlay/>);
    }
}
