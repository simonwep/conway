const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

const dist = path.resolve(__dirname, 'dist');
const crate = path.resolve(__dirname, 'crate');

module.exports = [
    {
        devtool: 'inline-source-map',
        target: 'webworker',

        entry: {
            'engine': './src/render/engine.worker.ts'
        },

        output: {
            path: dist,
            filename: '[name].worker.js'
        },

        resolve: {
            extensions: ['.js', '.ts', '.wasm']
        },

        module: {
            rules: [
                {
                    test: /\.(js|ts)$/,
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

            new WasmPackPlugin({
                crateDirectory: crate,
                extraArgs: '--target browser --mode normal',
                forceMode: 'production'
            })
        ]
    },
    {
        mode: 'development',
        devtool: 'inline-source-map',
        entry: './src/app.ts',

        resolve: {
            extensions: ['.ts', '.js', '.css']
        },

        output: {
            path: dist,
            filename: 'main.[hash].js',
            globalObject: 'this'
        },

        devServer: {
            contentBase: dist,
            writeToDisk: true,
            host: '0.0.0.0',
            port: 3008,
            hot: true
        },

        module: {
            rules: [
                {
                    test: /\.(js|ts)$/,
                    use: [
                        {
                            loader: 'ts-loader',
                            options: {
                                transpileOnly: true
                            }
                        }
                    ]
                },
                {
                    test: /\.css$/,
                    use: [
                        'style-loader',
                        'css-loader'
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
            })
        ]
    }
];
