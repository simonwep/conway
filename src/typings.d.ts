declare module '*.wasm';
declare module '*.scss';
declare module '*.svg';

// Environment
declare const env: {
    NODE_ENV: 'development' | 'production';
    VERSION: string;
};
