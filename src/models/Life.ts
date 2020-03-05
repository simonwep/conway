import {action, computed, observable} from 'mobx';

export default class Life {
    @observable public fps = 0;
    @observable public fpsLimitation: number | null = null;
    @observable public generation = 0;
    @observable public generationOffset = 0;

    @computed
    public get generationCount(): number {
        return this.generation - this.generationOffset;
    }

    @action
    public offsetGenerationCounter(): void {
        this.generationOffset = this.generation;
    }
}
