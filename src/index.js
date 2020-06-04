/* eslint-disable  */
import {on} from './lib/events';
import './app/web-components/index';
import './styles/_global.scss';

if (env.NODE_ENV === 'development') {

    // Inject react-hot-loader
    const runtime = require('react-refresh/runtime');
    runtime.injectIntoGlobalHook(window);

    if (module.hot) {
        module.hot.accept();
    }

    // See https://github.com/facebook/react/issues/16604#issuecomment-528663101
    window.$RefreshReg$ = () => {};
    window.$RefreshSig$ = () => type => type;
} else if (env.NODE_ENV === 'production') {
    console.log(`[INFO] Launching app build ${env.BUILD}`);

    navigator.serviceWorker.register(
        '/service-worker.js'
    ).then(() => {
        console.log('[SW] Registration Successful!');
    }).catch(reason => {
        console.log('[SW] Registration failed:', reason);
    });
}

// Disallow the context-menu entirely
on(window, 'contextmenu', e => e.preventDefault());

// Mount app
require('./app');
