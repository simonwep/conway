const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WorkerPlugin = require('worker-plugin');
const webpack = require('webpack');
const path = require('path');

const dist = path.resolve(__dirname, 'dist');
const crate = path.resolve(__dirname, 'crate');
const src = path.resolve(__dirname, 'src');
const app = path.resolve(src, 'app');

module.exports = {
    mode: 'development',
    entry: './src/index.tsx',
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
        extensions: ['.ts', '.tsx', '.js', '.css']
    },

    module: {
        rules: [
            {
                test: /\.(scss|sass|css)$/,
                include: app,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: {
                                localIdentName: '[name]-[hash:base64:5]'
                            }
                        }
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            prependData: `
                                @import '~sassyfication';
                                @import 'src/styles/_global.scss';
                            `
                        }
                    }
                ]
            },
            {
                test: /\.(scss|sass|css)$/,
                include: src,
                use: [
                    'style-loader',
                    'css-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            prependData: `
                                @import '~sassyfication';
                                @import 'src/styles/_global.scss';
                            `
                        }
                    }
                ]
            },
            {
                test: /\.(js|ts|tsx)$/,
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
