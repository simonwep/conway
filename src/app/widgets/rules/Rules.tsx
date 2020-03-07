import {observer}        from 'mobx-react';
import {Component, h}    from 'preact';
import {bind, cn}        from '../../../lib/preact-utils';
import {life}            from '../../../store';
import * as widgetStyles from '../widget.module.scss';
import * as styles       from './Rules.module.scss';

type UpdateRulesFunction = (n: number) => () => void;

@observer
export class Rules extends Component {

    @bind
    updateSurviveRules(index: number) {
        return () => {
            life.updateSurviveRules(life.surviveRules ^ (1 << index));
        };
    }

    @bind
    updateResurrectRules(index: number) {
        return () => {
            life.updateResurrectRules(life.resurrectRules ^ (1 << index));
        };
    }

    @bind
    inverseSurviveRules() {
        life.updateSurviveRules(~life.surviveRules);
    }

    @bind
    inverseResurrectRules() {
        life.updateResurrectRules(~life.resurrectRules);
    }

    generateNumberedList(fn: UpdateRulesFunction, rules: number) {
        return [...new Array(10)].map((_, index) => {
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

    render() {
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
                    <h3>Cell survives with <code>n</code> neighbors:</h3>
                </header>
                <div>{surviveList}</div>

                <header>
                    <button onClick={this.inverseResurrectRules}/>
                    <h3>Resurrect cells with <code>n</code> neighbors:</h3>
                </header>
                <div>{resurrectList}</div>
            </div>
        );
    }
}
