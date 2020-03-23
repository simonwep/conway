import {h}           from 'preact';
import {JSXInternal} from 'preact/src/jsx';
import lock          from '../icons/lock.svg';
import reset         from '../icons/reset.svg';
import settings      from '../icons/settings.svg';
import Element = JSXInternal.Element;

// TODO: Auto-load icons!
const icons = {
    settings,
    reset,
    lock
};

type Props = {
    name: keyof typeof icons;
};

export default ({name}: Props): Element => {
    return (
        <div className="icon" dangerouslySetInnerHTML={{__html: icons[name]}}/>
    );
};
