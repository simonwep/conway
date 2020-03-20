import {h, render} from 'preact';
import {App}       from './app/App';
import './styles/_global.scss';

render(
    <App/>,
    document.getElementById('app') as HTMLElement
);

/* eslint-disable no-console */
if (process.env.NODE_ENV === 'production') {
    navigator.serviceWorker.register(
        '/service-worker.js'
    ).then(() => {
        console.log('[SW] Registration Successful!');
    }).catch(reason => {
        console.log('[SW] Registration failed:', reason);
    });
}

