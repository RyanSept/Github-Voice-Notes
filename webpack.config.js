const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    entry: './src/index.tsx',
    devtool: "source-map",
    mode: "production",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'build'),
    },
    plugins: [
        new new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: './public/index.html'
        }),
        new CopyPlugin([
            { from: './public/manifest.json' },
            { from: './public/icon.jpg', to: 'static/icon.jpg' },
        ]
        ),
    ]
};
