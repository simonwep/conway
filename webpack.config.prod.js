const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    mode: 'production',
    entry: './src/app.js',

    output: {
        path: `${__dirname}/dist`,
        filename: '[hash:8].js'
    },

    module: {
        rules: [
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
                    mangle: {
                        toplevel: true,
                        properties: true
                    }
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
            filename: '[hash:8].css'
        }),

        new CleanWebpackPlugin()
    ]
};
