import {action, computed, observable} from 'mobx';
import {ActorInstance}                from '../actor/actor.main';
import {engine}                       from './';

export default class Life {
    @observable public fps = 0;
    @observable public fpsLimitation: number | null = null;
    @observable public generation = 0;
    @observable public generationOffset = 0;
    @observable public surviveRules = 0b000001100;
    @observable public resurrectRules = 0b000001000;
    @observable public zoomFactor = 1;

    // Engine to fetch data from
    private source: ActorInstance | null = null;

    public constructor() {
        setInterval(async () => {
            const {source} = this;

            if (source) {
                this.fps = await source.call('getFrameRate') as number;
                this.generation = await source.call('getGeneration') as number;
            }
        }, 1000);
    }

    @computed
    public get generationCount(): number {
        return this.generation - this.generationOffset;
    }

    @action
    public setEngine(engine: ActorInstance): void {
        this.source = engine;
    }

    @action
    public offsetGenerationCounter(): void {
        this.generationOffset = this.generation;
    }

    @action
    public setFPSLimitation(num: number | null): void {
        this.fpsLimitation = num;
        engine.call('limitFPS', num);
    }

    @action
    public updateSurviveRules(bitMap: number): void {
        this.surviveRules = bitMap;
        engine.call('updateRuleset', this.resurrectRules, this.surviveRules);
    }

    @action
    public updateResurrectRules(bitMap: number): void {
        this.resurrectRules = bitMap;
        engine.call('updateRuleset', this.resurrectRules, this.surviveRules);
    }

    public nextGeneration(): void {
        engine.call('nextGeneration');
    }

    public play(): void {
        engine.call('play');
    }

    public pause(): void {
        engine.call('pause');
    }
}

