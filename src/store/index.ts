import {Life} from '../engine/store';
import {Menu} from './models/Menu';

export const life = new Life();
export const menu = new Menu(life);
