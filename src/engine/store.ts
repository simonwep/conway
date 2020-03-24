import {action, computed, observable} from 'mobx';
import {ActorInstance}                from '../lib/actor/actor.main';
import {Engine}                       from './worker/main';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export class Life {
    @observable public fps = 0;
    @observable public fpsLimitation: number | null = null;
    @observable public generation = 0;
    @observable public generationOffset = 0;
    @observable public surviveRules = 0b000001100;
    @observable public resurrectRules = 0b000001000;
    @observable public zoomFactor = 1;
    @observable public cellSize = 2;
    @observable public paused = false;

    // Engine to fetch data from
    private source: ActorInstance<Engine> | null = null;

    public constructor() {

        setInterval(async () => {
            const {source} = this;

            if (source) {
                this.fps = await source.call('getFrameRate');
                this.generation = await source.call('getGeneration');
            }
        }, 1000);
    }

    @computed
    public get generationCount(): number {
        return this.generation - this.generationOffset;
    }

    @action
    public setEngine(engine: ActorInstance<Engine>): void {
        this.source = engine;
    }

    @action
    public offsetGenerationCounter(): void {
        this.generationOffset = this.generation;
    }

    @action
    public setFPSLimitation(num: number | null): void {
        this.fpsLimitation = num;
        this.source!.commit('limitFPS', num);
    }

    @action
    public updateSurviveRules(bitMap: number): void {
        this.surviveRules = bitMap;
        this.source!.commit('updateRuleset', this.resurrectRules, this.surviveRules);
    }

    @action
    public updateResurrectRules(bitMap: number): void {
        this.resurrectRules = bitMap;
        this.source!.commit('updateRuleset', this.resurrectRules, this.surviveRules);
    }

    @action
    public setCellSize(size: number): void {
        this.cellSize = size;

        // Sync with worker
        this.source!.commit('updateConfig', {
            cellSize: size
        });
    }

    @action
    public increaseCellSize(): void {
        const next = Math.max(1, Math.min(this.cellSize + 1, 10));
        if (next !== this.cellSize) {
            this.setCellSize(next);
        }
    }

    @action
    public decreaseCellSize(): void {
        const next = Math.max(1, Math.min(this.cellSize - 1, 10));
        if (next !== this.cellSize) {
            this.setCellSize(next);
        }
    }

    public nextGeneration(): void {
        this.source!.commit('nextGeneration');
    }

    @action
    public play(): void {
        this.source!.commit('play');
        this.paused = false;
    }

    @action
    public pause(): void {
        this.source!.commit('pause');
        this.paused = true;
    }

    @action
    public toggle(): void {
        if (this.paused) {
            this.play();
        } else {
            this.pause();
        }
    }
}

