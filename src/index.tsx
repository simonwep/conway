import {h, render} from 'preact';
import {App} from './app/App';
import {on}  from './lib/events';
import './styles/_global.scss';

render(
    <App/>,
    document.getElementById('app') as HTMLElement
);

/* eslint-disable no-console */
if (env.NODE_ENV === 'production') {
    console.log(`[INFO] Launching app v${env.VERSION}`);

    navigator.serviceWorker.register(
        '/service-worker.js'
    ).then(() => {
        console.log('[SW] Registration Successful!');
    }).catch(reason => {
        console.log('[SW] Registration failed:', reason);
    });
}

// Disallow the context-menu entirely
on(window, 'contextmenu', (e: MouseEvent) => e.preventDefault());
