module.exports = {
  outputDir: 'docs',
  productionSourceMap: false,
  publicPath: process.env.NODE_ENV === 'production' ? '/ex-gantt-chart/' : '/'
}
