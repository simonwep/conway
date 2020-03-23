import {observer}     from 'mobx-react';
import {Component, h} from 'preact';
import {JSXInternal}  from 'preact/src/jsx';
import {bind, cn}     from '../../lib/preact-utils';
import {menu}         from '../../store';
import styles         from './Menu.module.scss';
import Element = JSXInternal.Element;

@observer
export class Menu extends Component {

    @bind
    close(): void {
        menu.hide();
    }

    render(): Element {
        return (
            <div className={cn(styles.wrapper, {
                [styles.open]: menu.open
            })}>
                <div className={styles.menu}>

                    <div className={styles.menuHeader}>
                        <h2>Settings</h2>
                        <div onClick={this.close}/>
                    </div>

                </div>
            </div>
        );
    }
}
