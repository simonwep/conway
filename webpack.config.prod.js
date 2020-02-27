const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

module.exports = {
    mode: 'production',

    entry: './src/app.ts',

    resolve: {
        extensions: ['.js', '.ts', '.css', '.wasm'],
        modules: ['./']
    },

    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'js/main.[hash].js',
    },

    module: {
        rules: [
            {
                test: /\.worker\.ts$/,
                use: 'worker-loader'
            },
            {
                test: /\.(js|ts)$/,
                include: path.join(__dirname, 'src'),
                use: 'ts-loader'
            },
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader'
                ]
            }
        ]
    },

    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
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
            filename: 'css/[hash:8].css'
        }),

        new WasmPackPlugin({
            crateDirectory: path.resolve(__dirname, 'crate'),
            forceMode: 'production'
        }),

        new CleanWebpackPlugin()
    ]
};
