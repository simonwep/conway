import {h}     from 'preact';
import counter from '../../icons/counter.svg';
import frames  from '../../icons/frames.svg';

const icons = {
    counter,
    frames
};

type Props = {
    name: keyof typeof icons
};

export default ({name}: Props) => {
    return (
        <div class="icon" dangerouslySetInnerHTML={{__html: icons[name]}}/>
    );
}
