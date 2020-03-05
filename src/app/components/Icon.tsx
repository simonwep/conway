import {h}   from 'preact';
import lock  from '../../icons/lock.svg';
import reset from '../../icons/reset.svg';

const icons = {
    reset,
    lock
};

type Props = {
    name: keyof typeof icons;
};

export default ({name}: Props) => {
    return (
        <div className="icon" dangerouslySetInnerHTML={{__html: icons[name]}}/>
    );
};
