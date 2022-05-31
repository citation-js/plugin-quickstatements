module.exports = {
  presets: [
    [
      '@babel/env', {
        targets: {
          node: '14'
        }
      }
    ]
  ],
  env: {
    test: {
      plugins: ['istanbul']
    }
  },
  comments: false
}
