import {observer}        from 'mobx-react';
import {Component, h}    from 'preact';
import {JSXInternal}     from 'preact/src/jsx';
import {bind, cn}        from '../../lib/preact-utils';
import {menu, shortcuts} from '../../store';
import {Export}          from './export/Export';
import {KeyBindings}     from './keybindings/KeyBindings';
import styles            from './Menu.module.scss';

type Props = {};
type State = {
    currentPage: string;
};

@observer
export class Menu extends Component<Props, State> {
    state = {
        currentPage: 'Key Bindings'
    };
    private readonly pages = new Map<string, JSXInternal.Element>([
        ['Key Bindings', (<KeyBindings key={1}/>)],
        ['Export', (<Export key={2}/>)]
    ]);

    /* eslint-disable @typescript-eslint/no-var-requires */
    constructor() {
        super();

        // Register shortcut to open it
        shortcuts.register({
            name: 'open-menu',
            description: 'Show this menu',
            binding: ['ESCAPE'],
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

    render(): JSXInternal.Element {
        const {currentPage} = this.state;
        const navigation = [];
        const pages = [];

        for (const [name, page] of this.pages.entries()) {
            const open = currentPage === name;

            navigation.push(
                <button className={cn({[styles.openTab]: open})}
                        onClick={this.changeTab(name)}
                        key={name}>
                    {name}
                </button>
            );

            pages.push(
                <div className={cn(styles.pageWrapper, {
                    [styles.openPage]: open
                })}
                     key={name}>
                    {page}
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
                        <div className={styles.pages}>{pages}</div>
                    </div>
                </div>
            </div>
        );
    }
}
