const {WasmPackPlugin} = require('./config/WasmPackPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const WorkerPlugin = require('worker-plugin');
const webpack = require('webpack');
const pkg = require('./package');
const path = require('path');

const globalSCSS = path.resolve(__dirname, 'src/styles/_global.scss');
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
        filename: '[name].js'
    },

    devServer: {
        port: 3008,
        disableHostCheck: true,
        historyApiFallback: true,
        stats: 'errors-only',
        host: '0.0.0.0',
        quiet: true,
        hot: true
    },

    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.scss'],
        alias: {
            'react': 'preact/compat',
            'react-dom': 'preact/compat',
            'mobx': path.join(__dirname, '/node_modules/mobx/lib/mobx.es6.js')
        }
    },

    module: {
        rules: [
            {
                test: /\.svg$/,
                loader: 'svg-inline-loader'
            },
            {
                enforce: 'pre',
                test: /\.s[ac]ss$/,
                use: [
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true,
                            prependData: '@import "src/styles/_variables.scss";',
                            sassOptions: {
                                includePaths: [globalSCSS]
                            }
                        }
                    }
                ]
            },
            {
                test: /\.module\.(scss|sass|css)$/,
                include: app,
                use: [
                    'css-hot-loader',
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true,
                            importLoaders: 1,
                            modules: {
                                localIdentName: '[name]__[hash:base64:5]'
                            }
                        }
                    }
                ]
            },
            {
                test: /\.(scss|sass|css)$/,
                exclude: app,
                use: [
                    'css-hot-loader',
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                            sourceMap: true
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
            'env': {
                'NODE_ENV': JSON.stringify('development'),
                'VERSION': JSON.stringify(pkg.version)
            }
        }),

        new HtmlWebpackPlugin({
            template: 'public/index.html',
            inject: true
        }),

        new WasmPackPlugin({
            crate: crate,
            mode: 'production'
        }),

        new CopyPlugin([{
            context: 'src',
            from: 'assets'
        }]),

        new WorkerPlugin({
            globalObject: 'self'
        })
    ]
};
