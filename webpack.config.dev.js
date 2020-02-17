const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    mode: 'development',
    entry: './src/app.js',

    output: {
        path: `${__dirname}/dist`,
        filename: 'bundle.min.js'
    },

    devServer: {
        contentBase: `${__dirname}/dist`,
        host: '0.0.0.0',
        port: 3008,
        hot: true
    },

    module: {
        rules: [
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
};
