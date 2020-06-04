import {Component, h} from 'preact';
import {JSXInternal}  from 'preact/src/jsx';
import {init}         from '../engine';
import {random}       from '../lib/random';
import styles         from './LoadingOverlay.module.scss';
import Element = JSXInternal.Element;

const frames = [
    [
        0, 1, 0,
        0, 0, 1,
        1, 1, 1
    ],
    [
        1, 0, 1,
        0, 1, 1,
        0, 1, 0
    ],
    [
        0, 0, 1,
        1, 0, 1,
        0, 1, 1
    ],
    [
        1, 0, 0,
        0, 1, 1,
        1, 1, 0
    ]
];

type Props = {
    onLoaded: () => void;
};

type State = {
    frameIndex: number;
    finish: boolean;
    randomTarget: Array<string>;
};

export class LoadingOverlay extends Component<Props, State> {

    state = {
        frameIndex: 0,
        finish: false,
        randomTarget: []
    };

    componentDidMount(): void {
        const start = performance.now() + 350 * 4;

        const interval = setInterval(() => {
            const next = this.state.frameIndex + 1;
            this.setState({
                frameIndex: (next + 1) > frames.length ? 0 : next
            });
        }, 250);

        // TODO: What about errors?
        init().then((): void => {

            // Wait at lease two seconds to increase the perceived performance
            const remainingTime = Math.max(0, start - performance.now());

            setTimeout((): void => {

                clearInterval(interval);
                const randomTarget = [];

                for (let i = 0; i < 9; i++) {
                    const x = random(-25, 25);
                    const y = random(75, 100);
                    const ry = random(-190, 190);
                    const rx = random(-190, 190);
                    const s = random(0.5, 1.5);
                    randomTarget.push(`translate3d(${x}vw, ${y}vh, 0) rotateY(${ry}deg) rotateX(${rx}deg) scale(${s}) perspective(1000px)`);
                }

                this.setState({
                    finish: true,
                    randomTarget
                });

                // Wait until animation is over
                setTimeout((): void => {
                    this.props.onLoaded();
                }, 1500);
            }, remainingTime);
        });
    }

    render(_: Props, {frameIndex, finish, randomTarget}: State): Element {
        const frame = frames[frameIndex];

        const tiles = frame.map((cell, index) => {
            const transform = finish ? randomTarget[index] : 0;

            return (
                <div key={index}
                     className={styles.cell}
                     style={{transform}}
                     data-active={!!cell}/>
            );
        });

        return (
            <div className={styles.loadingOverlay}
                 data-finish={finish}>
                <div>{tiles}</div>
                <p className={styles.bottomText}>Build from {env.BUILD} by Simon R.</p>
            </div>
        );
    }
}
