var async = require('async')
var fs = require('fs')

var clearFiles = function (files, amountToClear, cb) {
  amountCleared = amountCleared || 0
  filesCleared = filesCleared || []
  var filesCleared = []
  var amountCleared = 0
  var index = 0
  async.whilst(
    function () {
      return (amountCleared < amountToClear) && (index < files.length)
    },
    function (callback) {
      fs.unlink(files[index].fileFullPath, function (err) {
        if (err) return callback(err)
        filesCleared.push(files[index])
        amountCleared = amountCleared + parseFloat((files[index].fileStats.size / 1024 / 1024).toFixed(2))
        index++
        callback()
      })
    },
    function (err) {
      if (err) cb(err)
      return cb(null, {filesCleared: filesCleared, amountCleared: amountCleared})
    }
  )
}

module.exports = clearFiles
