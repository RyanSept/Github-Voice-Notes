const CopyPlugin = require("copy-webpack-plugin")
const path = require("path")
const Dotenv = require("dotenv-webpack")

module.exports = {
    entry: {
        main: "./src/index.tsx",
        "page-script": "./src/page-script.ts",
    },
    devtool: "inline-source-map",
    mode: "production",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: [
                    {
                        loader: "style-loader",
                        options: {
                            esModule: true,
                            modules: {
                                namedExport: true,
                            },
                        },
                    },
                    {
                        loader: "css-loader",
                        options: {
                            importLoaders: 1,
                            esModule: true,
                            modules: {
                                namedExport: true,
                            },
                            url: true,
                        },
                    },
                ],
            },
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    output: {
        path: path.resolve(__dirname, "build"),
    },
    plugins: [
        new CopyPlugin([
            { from: "./public/manifest.json" },
            { from: "./public/*.jpg", to: "static", flatten: true },
            { from: "./public/*.png", to: "static", flatten: true },
        ]),
        new Dotenv({ path: __dirname + "/.env" }),
    ],
}
