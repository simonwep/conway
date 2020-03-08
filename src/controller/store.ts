import {Remote}                       from 'comlink';
import {action, computed, observable} from 'mobx';
import {engine}       from './';
import {EngineWorker} from './engine.worker';

export default class Life {
    @observable public fps = 0;
    @observable public fpsLimitation: number | null = null;
    @observable public generation = 0;
    @observable public generationOffset = 0;
    @observable public surviveRules = 0b000001100;
    @observable public resurrectRules = 0b000001000;
    @observable public zoomFactor = 1;

    // Engine to fetch data from
    private source: Remote<EngineWorker> | null = null;

    public constructor() {
        setInterval(async () => {
            const {source} = this;

            if (source) {
                this.fps = await source.getFrameRate();
                this.generation = await source.getGeneration();
            }
        }, 1000);
    }

    @computed
    public get generationCount(): number {
        return this.generation - this.generationOffset;
    }

    @action
    public setSource(engine: Remote<EngineWorker>): void {
        this.source = engine;
    }

    @action
    public offsetGenerationCounter(): void {
        this.generationOffset = this.generation;
    }

    @action
    public setFPSLimitation(num: number | null): void {
        this.fpsLimitation = num;
        engine.limitFPS(num);
    }

    @action
    public updateSurviveRules(bitMap: number): void {
        this.surviveRules = bitMap;
        engine.updateRuleset(this.resurrectRules, this.surviveRules);
    }

    @action
    public updateResurrectRules(bitMap: number): void {
        this.resurrectRules = bitMap;
        engine.updateRuleset(this.resurrectRules, this.surviveRules);
    }
}

