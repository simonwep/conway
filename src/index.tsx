import {transfer, wrap}            from 'comlink';
import {h, render}                 from 'preact';
import {App}                       from './app/App';
import {life}                      from './store';
import './styles/_global.scss';
import {Config, EngineConstructor} from './controller/engine';

render(
    <App/>,
    document.getElementById('app') as HTMLElement
);

