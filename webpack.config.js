const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const CopyPlugin = require("copy-webpack-plugin")

module.exports = {
    entry: {
        main: "./src/index.tsx",
        background: "./src/background.ts",
    },
    devtool: "source-map",
    mode: "production",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    output: {
        path: path.resolve(__dirname, "build"),
        hotUpdateChunkFilename: "hot/hot-update.js",
        hotUpdateMainFilename: "hot/hot-update.json",
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./public/index.html",
        }),
        new CopyPlugin([
            { from: "./public/manifest.json" },
            { from: "./public/icon.jpg", to: "static/icon.jpg" },
        ]),
    ],
}
