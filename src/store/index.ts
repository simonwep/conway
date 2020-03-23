import {Life}              from '../engine/store';
import {KeyboardShortcuts} from './models/KeyboardShortcuts';
import {Menu}              from './models/Menu';

export const life = new Life();
export const menu = new Menu(life);
export const shortcuts = KeyboardShortcuts.getInstance();
