import {h}    from 'preact';
import styles from './LoadingOverlay.scss';


export function LoadingOverlay() {
    return (
        <div className={styles.loadingOverlay}>
            <p>Loading...</p>
        </div>
    );
}
