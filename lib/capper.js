var fs_sort = require('fs-sort')
var empty_spaces = require('empty-spaces')
var util = require('util')
var events = require('events')
var async = require('async')
var pauseableInterval = require('./pauseableInterval')
var clearFiles = require('./clearFiles')

function Capper (opt, cb) {
  if (typeof opt.folderToCap === 'undefined') throw new Error('Must provide a path to monitor')
  this.folderToCap = opt.folderToCap
  this.ignores = opt.ignores || []
  this.folderToClear = opt.folderToClear || opt.folderToCap
  this.capSize = opt.capSize || '5%'
  this.sortingFunction = opt.sortingFunction
  if (typeof this.sortingFunction !== 'function') {
    this.sortingFunction = function (fileObject) {
      return fileObject.fileStats.size
    }
  }
  this.retryTime = opt.retryTime
  if (opt.autoWatchInterval) {
    this.autoWatchInterval = opt.autoWatchInterval
    this.startWatchMode()
  }
}

util.inherits(Capper, events.EventEmitter)

Capper.prototype.clear = function (cb) {
  var amountToClear = 0
  var pathSize = 0
  var maximumSize = 0
  var self = this
  self.pauseWatchMode()
  async.waterfall([
    function (callback) {
      self.checkFreeSpace(callback)
    },
    function (result, callback) {
      amountToClear = result.amountToClear
      pathSize = result.pathSize
      maximumSize = result.maximumSize
      if (amountToClear > 0) {
        return fs_sort(self.folderToClear, self.ignores, self.sortingFunction, callback)
      }
      callback(null, [])
    },
    function (fileList, callback) {
      clearFiles(fileList, amountToClear, callback)
    }], function (err, result) {
      self.resumeWatchMode()
      if (err) return cb(err)
      return cb(null, {
        amountLeftToClear: pathSize - maximumSize + result.amountCleared,
        amountCleared: result.amountCleared,
        filesCleared: result.filesCleared
      })
    }
  )
}

Capper.prototype.startWatchMode = function (interval) {
  this.autoWatchInterval = interval || this.interval || 60000
  this.emit('start watch mode')
  var self = this
  this.watchTimer = pauseableInterval(function () {
    self.checkFreeSpace(function (err, result) {
      if (err) return self.emit('error', err)
      if (result.amountToClear > 0) self.emit('full', result.amountToClear)
    })
  }, this.autoWatchInterval)
}

Capper.prototype.pauseWatchMode = function () {
  if (this.watchTimer) {
    this.emit('pause watch mode')
    this.watchTimer.pause()
  }
}

Capper.prototype.resumeWatchMode = function () {
  if (this.watchTimer) {
    this.emit('resume watch mode')
    this.watchTimer.resume()
  }
}

Capper.prototype.stopWatchMode = function () {
  if (this.watchTimer) {
    this.watchTimer.stop()
    this.emit('stop watch mode')
  }
}

Capper.prototype.checkFreeSpace = function (cb) {
  var opt = {
    pathToCheck: this.folderToCap,
    maximumSize: this.capSize,
    retryTime: this.retryTime
  }
  empty_spaces(opt, function (err, result) {
    if (err) return cb(err)
    cb(null, result)
  })
}

module.exports = Capper
