import {observable} from 'mobx';

export default class Life {
    @observable public fps = 0;
    @observable public generation = 0;
}
