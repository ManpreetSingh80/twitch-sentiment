const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { DefinePlugin } = require('webpack');

module.exports = env => {
	return {
		mode: 'development',
		devtool: 'cheap-module-source-map',
		entry: {
			content: path.join(__dirname, 'src/app/content.js'),
			background: path.join(__dirname, 'src/app/background.js'),
			twitch: path.join(__dirname, 'src/app/twitch.js'),
		},
		output: { path: path.join(__dirname, env.DIST || 'dist'), filename: '[name].js' },
		module: {
			rules: [
				{
					test: /\.(js|jsx)$/,
					use: 'babel-loader',
					exclude: /node_modules/,
				},
				{
					test: /\.s[ac]ss$/i,
					use: [
						{
							loader: 'file-loader',
							options: { outputPath: 'styles/', name: '[name].css' }
						},
						'sass-loader'
					]
				},
				{
					test: /\.svg$/,
					use: ['@svgr/webpack'],
				},
				{
					test: /\.png$/,
					use: [
						{
							loader: 'url-loader',
							options: {
								mimetype: 'image/png',
							},
						},
					],
				},
			]
		},
		resolve: {
			plugins: [],
			extensions: ['.js', '.jsx', '.tsx', '.ts'],
			alias: {
				'react-dom': '@hot-loader/react-dom',
			},
		},
		devServer: {
			contentBase: './dist',
		},
		plugins: [
			new CopyPlugin({
				patterns: [
					{ from: 'public/icon', to: '.', },
					// { from: 'public/image', to: 'image/' },
					{ from: 'public/models', to: 'models/' },
					{
						from: `public/manifest.v${env.MANIFEST_VERSION === '3' ? '3' : '2'}.json`,
						to: 'manifest.json'
					}
				],
			}),
			new DefinePlugin({
				__ENVIRONMENT__: JSON.stringify('development'),
				AppMeta: JSON.stringify({ version: 1 })
			}),
		],
	}
};
