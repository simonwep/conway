import {action, observable} from 'mobx';
import {Life}               from '../../engine/store';

export class Menu {
    @observable public open = false;
    private life: Life;
    private lifeWasPaused = false;

    constructor(life: Life) {
        this.life = life;
    }

    @action
    public show(): void {
        this.lifeWasPaused = this.life.paused;
        this.open = true;
        this.life.pause();
    }

    @action
    public hide(): void {
        this.open = false;
        if (!this.lifeWasPaused) {
            this.life.play();
        }
    }
}
