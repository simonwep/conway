import {observer}        from 'mobx-react';
import {Component, h}    from 'preact';
import {JSXInternal}     from 'preact/src/jsx';
import {bind, cn}        from '../../../lib/preact-utils';
import {life, menu}      from '../../../store';
import Icon              from '../../components/Icon';
import * as widgetStyles from '../widget.module.scss';
import * as styles       from './Controls.module.scss';

@observer
export class Controls extends Component {

    @bind
    toggleRunState(): void {
        life.toggle();
    }

    @bind
    nextGeneration(): void {
        life.nextGeneration();
    }

    @bind
    showMenu(): void {
        menu.show();
    }

    render(): JSXInternal.Element {
        const {paused} = life;

        return (
            <div className={cn(
                widgetStyles.widget,
                styles.controls
            )}>

                <button className={styles.settingsBtn}
                        onClick={this.showMenu}>
                    <Icon name="settings"/>
                </button>
                <p/>

                <button className={styles.playPauseBtn}
                        data-state={paused ? 'playing' : 'paused'}
                        onClick={this.toggleRunState}/>
                <p/>

                <button className={styles.forwardBtn}
                        data-state={paused ? 'enabled' : 'disabled'}
                        onClick={this.nextGeneration}>
                    <div/>
                    <div/>
                </button>
            </div>
        );
    }
}
