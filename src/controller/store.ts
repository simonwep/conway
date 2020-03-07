import {Remote}                       from 'comlink';
import {action, computed, observable} from 'mobx';
import {controls}                     from './';
import {Engine}                       from './engine';

export default class Life {
    @observable public fps = 0;
    @observable public fpsLimitation: number | null = null;
    @observable public generation = 0;
    @observable public generationOffset = 0;
    @observable public surviveRules = 0b000001100;
    @observable public resurrectRules = 0b000001000;

    // Engine to fetch data from
    private source: Remote<Engine> | null = null;

    public constructor() {
        setInterval(async () => {
            const {source} = this;

            if (source) {
                this.fps = await source.getFrameRate();
                this.generation = await source.getGeneration();
            }
        }, 1000);
    }

    @action
    public setSource(engine: Remote<Engine>): void {
        this.source = engine;
    }

    @computed
    public get generationCount(): number {
        return this.generation - this.generationOffset;
    }

    @action
    public offsetGenerationCounter(): void {
        this.generationOffset = this.generation;
    }

    @action
    public setFPSLimitation(num: number | null): void {
        this.fpsLimitation = num;
        controls.limitFPS(num);
    }

    @action
    public updateSurviveRules(bitMap: number): void {
        this.surviveRules = bitMap;
        controls.updateRuleset(this.resurrectRules, this.surviveRules);
    }

    @action
    public updateResurrectRules(bitMap: number): void {
        this.resurrectRules = bitMap;
        controls.updateRuleset(this.resurrectRules, this.surviveRules);
    }
}

