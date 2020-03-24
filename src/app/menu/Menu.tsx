import {observer}        from 'mobx-react';
import {Component, h}    from 'preact';
import {JSXInternal}     from 'preact/src/jsx';
import {bind, cn}        from '../../lib/preact-utils';
import {menu, shortcuts} from '../../store';
import {Appearance}      from './appearance/Appearance';
import {KeyBindings}     from './keybindings/KeyBindings';
import styles            from './Menu.module.scss';
import Element = JSXInternal.Element;

type Props = {};
type State = {
    currentPage: string;
};

@observer
export class Menu extends Component<Props, State> {
    private readonly pages = new Map([
        ['Key Bindings', (<KeyBindings key={1}/>)],
        ['Appearance', (<Appearance key={2}/>)]
    ]);

    state = {
        currentPage: 'Key Bindings'
    };

    /* eslint-disable @typescript-eslint/no-var-requires */
    constructor() {
        super();

        // Register shortcut to open it
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

    @bind
    changeTab(name: string): () => void {
        return (): void => {
            if (name !== this.state.currentPage) {
                this.setState({
                    currentPage: name
                });
            }
        };
    }

    render(): Element {
        const {currentPage} = this.state;
        const navigation = [];
        const pages = [];

        for (const [name, page] of this.pages.entries()) {
            const open = currentPage === name;

            navigation.push(
                <button className={cn([styles.openTab, open])}
                        onClick={this.changeTab(name)}
                        key={name}>
                    {name}
                </button>
            );

            pages.push(
                <div className={styles.page}
                     key={name}>
                    <div className={cn(styles.pageWrapper, [styles.openPage, open])}>
                        {page}
                    </div>
                </div>
            );
        }

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
                        <div className={styles.navigation}>{navigation}</div>
                        <div>{pages}</div>
                    </div>
                </div>
            </div>
        );
    }
}
