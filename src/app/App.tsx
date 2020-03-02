import {h}         from 'preact';
import {Controls}  from './widgets/controls/Controls';
import {LifeStats} from './widgets/life-stats/LifeStats';

export function App() {
    return (
        <div>
            <LifeStats/>
            <Controls/>
        </div>
    );
}
