
module.exports = {
  entry: './dev/index.js',
  output: {
    filename: './tmp/main.bundle.js'
  },
  module: {
    rules: [{
      test: /\.txt$/,
      use: {
        loader: './index.js',
        options: {
          stages: [{
            regex: /#\{(.+?)\}/g,
            value: function (match) {
              var context = getContext()
              return context[match[1]] || match[0]
            }
          },
          {
            regex: '#\\{(.+?)\\}',
            flags: 'g',
            value: function(match) {
              var vars = ['', 'glitter', 'lost', 'wither', 'frost',
                'woken', 'spring', 'broken', 'king']
              var index = match[1]
              return '(' + vars[index] + ')'
            }
          }]
        }
      }
    }]
  }
}

function getContext() {
  return {
    date: new Date().toDateString(),
    time: new Date().toTimeString()
  }
}