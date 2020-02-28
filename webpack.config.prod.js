const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const WorkerPlugin = require('worker-plugin');
const webpack = require('webpack');
const path = require('path');

const dist = path.resolve(__dirname, 'dist');
const crate = path.resolve(__dirname, 'crate');
const src = path.resolve(__dirname, 'src');

module.exports = {
    mode: 'production',
    entry: './src/app.ts',
    devtool: 'source-map',

    output: {
        path: dist,
        globalObject: 'self',
        filename: '[name].[contenthash:8].bundle.js'
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
                    MiniCssExtractPlugin.loader,
                    'css-loader'
                ]
            },
            {
                test: /\.(js|ts)$/,
                include: src,
                use: 'ts-loader'
            }
        ]
    },

    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                sourceMap: true,
                terserOptions: {
                    mangle: true
                }
            }),

            new OptimizeCSSAssetsPlugin({})
        ]
    },

    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),

        // new BundleAnalyzerPlugin(),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'public/index.html',
            inject: true,
            minify: true
        }),

        new MiniCssExtractPlugin({
            filename: 'css/[name].[contenthash:5].css',
            chunkFilename: 'css/[name].[contenthash:5].css'
        }),

        new WasmPackPlugin({
            crateDirectory: crate,
            extraArgs: '--target browser --mode normal',
            forceMode: 'production'
        }),

        new WorkerPlugin(),
        new CleanWebpackPlugin()
    ]
};
