declare namespace JSX {
    interface IntrinsicElements {
        'check-box': unknown;
    }
}

declare interface CheckBoxElement extends HTMLElement {
    checked: boolean;
}
