import {observer}        from 'mobx-react';
import {Component, h}    from 'preact';
import {JSXInternal}     from 'preact/src/jsx';
import {bind, cn}        from '../../../lib/preact-utils';
import {life}            from '../../../store';
import * as widgetStyles from '../widget.module.scss';
import * as styles       from './Rules.module.scss';
import Element = JSXInternal.Element;

type UpdateRulesFunction = (n: number) => () => void;

@observer
export class Rules extends Component {

    @bind
    updateSurviveRules(index: number): () => void {
        return (): void => {
            life.updateSurviveRules(life.surviveRules ^ (1 << index));
        };
    }

    @bind
    updateResurrectRules(index: number): () => void {
        return (): void => {
            life.updateResurrectRules(life.resurrectRules ^ (1 << index));
        };
    }

    @bind
    inverseSurviveRules(): void {
        life.updateSurviveRules(life.surviveRules ^ 0b111111111 );
    }

    @bind
    inverseResurrectRules(): void {
        life.updateResurrectRules(life.resurrectRules ^ 0b111111111);
    }

    generateNumberedList(fn: UpdateRulesFunction, rules: number): Array<Element> {
        return [...new Array(9)].map((_, index): Element => {
            return <button onClick={fn(index)}
                           key={index}
                           data-bit-index={index}
                           className={cn({
                               [styles.active]: !!((1 << index) & rules)
                           })}>
                <span>{index}</span>
            </button>;
        });
    }

    render(): Element {
        const {surviveRules, resurrectRules} = life;
        const surviveList = this.generateNumberedList(this.updateSurviveRules, surviveRules);
        const resurrectList = this.generateNumberedList(this.updateResurrectRules, resurrectRules);

        return (
            <div className={cn(
                widgetStyles.widget,
                styles.rules
            )}>
                <header>
                    <button onClick={this.inverseSurviveRules}/>
                    <p>Cell survives with <code>n</code> neighbors:</p>
                </header>
                <div>{surviveList}</div>

                <header>
                    <button onClick={this.inverseResurrectRules}/>
                    <p>Resurrect cells with <code>n</code> neighbors:</p>
                </header>
                <div>{resurrectList}</div>
            </div>
        );
    }
}
