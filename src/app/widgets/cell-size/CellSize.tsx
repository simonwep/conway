import {observer}            from 'mobx-react';
import {Component, h}        from 'preact';
import {JSXInternal}         from 'preact/src/jsx';
import {bind}                from '../../../lib/preact-utils';
import {life}                from '../../../store';
import {VerticalNumberInput} from '../../components/VerticalNumberInput';
import styles                from './CellSize.module.scss';

@observer
export class CellSize extends Component {

    @bind
    onChange(value: number): null | void {
        life.setCellSize(value);
    }

    render(): JSXInternal.Element {
        return (
            <VerticalNumberInput
                class={styles.cellSize}
                increase={<button className={styles.largeBlock}/>}
                decrease={<button className={styles.smallBlock}/>}
                min={1}
                max={10}
                baseValue={2}
                onChange={this.onChange}
                useValue={life.cellSize}
            />
        );
    }
}
