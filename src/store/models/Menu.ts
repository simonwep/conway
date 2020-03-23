import {action, observable} from 'mobx';
import {Life}               from '../../engine/store';

export class Menu {
    @observable open = true;
    private life: Life;

    constructor(life: Life) {
        this.life = life;
    }

    @action
    public show(): void {
        this.life.pause();
        this.open = true;
    }

    @action
    public hide(): void {
        this.open = false;
    }
}
