var Capper = require(__dirname + '/../index')
var async = require('async')
var jf = require('jsonfile')
var options = jf.readFileSync(__dirname + '/testScenarios.json')
var count = 0
var folderAmountRand = 20
var fileAmountRand = 10
var fileSizeRand = 10000000
var fs = require('fs')

// var capper = new Capper({
//   'folderToCap': __dirname + '/data',
//   'capSize': 50,
//   'retryTime': 10000
// })
// capper.checkFreeSpace(function (err, result) {
//   if (err) console.error(err)
//   console.log('Room taken by path: ' + result.pathSize + ' MB')
//   console.log('Maximum allowed size: ' + result.maximumSize + ' MB')
//   if (result.amountToClear < 0) {
//     console.log('Room Left: ' + (result.amountToClear * -1) + ' MB')
//   } else {
//     console.log('Space that needs to be clear: ' + result.amountToClear + ' MB')
//   }
// })

var deleteFolderRecursive = function (path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function (file, index) {
      var curPath = path + '/' + file
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath)
      } else { // delete file
        fs.unlinkSync(curPath)
      }
    })
    fs.rmdirSync(path)
  }
}
var fileNames = []

describe('Check Transaction from raw data', function () {
  this.timeout(0)
  before(function (done) {
    var m = Math.floor(Math.random() * folderAmountRand)
    var data = __dirname + '/data'
    var jump = false
    var newFolder = true
    fs.mkdirSync(data)
    for (var i = 0; i < m; i++) {
      var n = Math.floor(Math.random() * fileAmountRand)
      if (Math.random() > 0.5) {
        data = data + '/data' + i
        jump = true
        newFolder = true
        fs.mkdirSync(data)
      }
      var fileNamesTemp = []
      for (var j = 0; j < n && newFolder; j++) {
        var size = Math.floor(Math.random() * (fileSizeRand - 1) + 1)
        var fileName = (Math.random() * 10).toFixed(0)
        if (fileNamesTemp.indexOf(fileName) === -1) {
          fileNamesTemp.push(fileName)
          fileNames.push(fileName)
          // console.log(fileName, data)
          fs.writeFileSync(data + '/' + fileName + '.tmp', new Buffer(size), 0, size - 1)
        }
      }
      if (jump && Math.random() > 0.5) {
        data = data.slice(0, data.lastIndexOf('/data'))
        jump = false
      }
      newFolder = false
    }
    done()
  })

  it('should do something', function (done) {
    async.whilst(
      function () {
        return count < options.length
      },
      function (callback) {
        console.log('----------Test ' + (count + 1) + '----------')
        // if (options[count].pathToCheck === '__dirname')
        options[count].folderToCap = __dirname + options[count].folderToCap
        // console.log('Maximum allowed size: ' + options[count].maximumSize)
        var capper = new Capper(options[count])
        capper.checkFreeSpace(function (err, result) {
          if (err) return callback(err)
          console.log('Room taken by path: ' + result.pathSize + ' MB')
          console.log('Maximum allowed size: ' + result.maximumSize + ' MB')
          if (result.amountToClear < 0) {
            console.log('Room Left: ' + (result.amountToClear * -1) + ' MB')
          } else {
            console.log('Space that needs to be clear: ' + result.amountToClear + ' MB')
          }
          count++
          callback()
        })
      },
      function (err) {
        console.log('--------------------------')
        if (err) return console.error(err)
        console.log('Finished with flying Colors')
        done()
      }
    )
  })

  after(function (done) {
    deleteFolderRecursive(__dirname + '/data')
  })
})
