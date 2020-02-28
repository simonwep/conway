const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WorkerPlugin = require('worker-plugin');
const webpack = require('webpack');
const path = require('path');

const dist = path.resolve(__dirname, 'dist');
const crate = path.resolve(__dirname, 'crate');
const src = path.resolve(__dirname, 'src');

module.exports = {
    mode: 'development',
    entry: './src/app.ts',
    devtool: 'inline-source-map',

    output: {
        path: dist,
        globalObject: 'self',
        filename: '[chunkhash].bundle.js'
    },

    devServer: {
        port: 3008
    },

    resolve: {
        extensions: ['.ts', '.js', '.css']
    },

    module: {
        rules: [
            {
                test: /\.css$/,
                include: src,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.(js|ts)$/,
                include: src,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true
                        }
                    }
                ]
            }
        ]
    },

    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development')
        }),

        new HtmlWebpackPlugin({
            template: 'public/index.html',
            inject: true
        }),

        new WasmPackPlugin({
            crateDirectory: crate,
            extraArgs: '--target browser --mode normal',
            forceMode: 'production'
        }),

        new WorkerPlugin()
    ]
};
