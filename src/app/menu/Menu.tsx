import {observer}        from 'mobx-react';
import {Component, h}    from 'preact';
import {JSXInternal}     from 'preact/src/jsx';
import {bind, cn}        from '../../lib/preact-utils';
import {menu, shortcuts} from '../../store';
import {KeyBindings}     from './keybinds/KeyBindings';
import styles            from './Menu.module.scss';
import Element = JSXInternal.Element;

@observer
export class Menu extends Component {

    constructor() {
        super();

        shortcuts.register({
            name: 'open-menu',
            description: 'Show this menu',
            binding: ['Escape'],
            callbacks: [(): void => menu.open ? menu.hide() : menu.show()]
        });
    }

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
                        <button onClick={this.close}/>
                    </div>

                    <div className={styles.content}>
                        <KeyBindings/>
                    </div>
                </div>
            </div>
        );
    }
}
