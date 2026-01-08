const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');

module.exports = {
  entry: {
    background: './src/core/background.ts',
    content: './src/core/content.ts',
    devtools: './src/core/devtools.ts',
    'devtools-app': './src/core/devtools-app.ts',
    injected: './src/core/injected.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          appendTsSuffixTo: [/\.vue$/],
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '.vue'],
    alias: {
      'vue': '@vue/runtime-dom',
    },
  },
  plugins: [
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      template: './src/core/devtools.html',
      filename: 'devtools.html',
      chunks: ['devtools'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'src/icons', to: 'icons' },
      ],
    }),
  ],
  devtool: 'source-map',
  ignoreWarnings: [
    /Failed to parse source map/,
    /TS18047/,
    /TS7031/,
  ],
  // 性能配置：对于浏览器扩展，bundle大小限制可以放宽
  // 浏览器扩展场景下，较大的bundle是正常的（包含完整UI框架）
  performance: {
    hints: false, // 完全禁用性能警告（扩展场景不需要）
  },
};
