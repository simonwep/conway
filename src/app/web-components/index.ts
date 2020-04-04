import './check-box';

/* eslint-disable @typescript-eslint/no-namespace */
declare module 'preact/src/jsx' {
    namespace JSXInternal {
        import HTMLAttributes = JSXInternal.HTMLAttributes;

        interface IntrinsicElements {
            'check-box': HTMLAttributes<CheckBoxElement>;
        }
    }
}
