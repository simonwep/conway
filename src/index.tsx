import {h, render} from 'preact';
import {App}       from './app/App';
import './styles/_global.scss';

render(
    <App/>,
    document.getElementById('app') as HTMLElement
);

