import {action, computed, observable} from 'mobx';
import {serialize}                    from 'nason';
import {ActorInstance, transfer}      from '../lib/actor/actor.main';
import {compressBooleanArray}         from '../lib/bool-array-utils';
import {download}                     from '../lib/download';
import {formatDate}                   from '../lib/format-date';
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

    public registerGraphicCanvas(
        canvas: OffscreenCanvas,
        canvasRect: DOMRect
    ): void {
        this.source!.commit('setGraphCanvas', transfer(canvas), canvasRect);
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
    public setSurviveRules(bitMap: number): void {
        this.surviveRules = bitMap;
        this.source!.commit('updateRuleset', this.resurrectRules, this.surviveRules);
    }

    @action
    public setResurrectRules(bitMap: number): void {
        this.resurrectRules = bitMap;
        this.source!.commit('updateRuleset', this.resurrectRules, this.surviveRules);
    }

    @action
    public setGenerationCounter(newCount: number): void {
        this.generation = newCount;
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

    public exportAsSVG(darkTheme: boolean): void {
        this.source!.call('convertToSvg', darkTheme).then(str => {
            download(str, `life-${formatDate('DD-MM-YYYY')}.svg`);
        });
    }

    public exportAsLBin({ruleSet, generation, fpsLock}: {
        ruleSet: boolean;
        generation: boolean;
        fpsLock: boolean;
    }): void {
        Promise.all([
            this.source!.call('getCurrentGen'),
            this.source!.call('getEnv')
        ]).then(([cells, env]) => {
            const data = serialize({
                cells: compressBooleanArray(cells),
                cellSize: env.cellSize,
                cols: env.cols,
                rows: env.rows,
                rules: ruleSet ? {
                    resurrect: this.resurrectRules,
                    survive: this.surviveRules
                } : null,
                generation: generation ? this.generation : null,
                fpsLock: fpsLock && this.fpsLimitation !== null ? this.fpsLimitation : null
            });

            download(data, `life-${formatDate('DD-MM-YYYY')}.lb`);
        });
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

