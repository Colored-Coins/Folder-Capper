function InvervalTimer (callback, interval) {
  var timer, startTime, remaining = 0
  var state = 0 //  0 = idle, 1 = running, 2 = paused, 3= resumed

  this.pause = function () {
    if (state !== 1) return
    remaining = interval - (new Date() - startTime)
    clearInterval(timer)
    state = 2
  }

  this.resume = function () {
    if (state !== 2) return
    state = 3
    setTimeout(this.timeoutCallback, remaining)
  }

  this.timeoutCallback = function () {
    if (state !== 3) return
    callback()
    startTime = new Date()
    timer = setInterval(callback, interval)
    state = 1
  }

  this.stop = function () {
    clearInterval(timer)
    state = 0
  }

  this.start = function () {
    if (state !== 0) return
    startTime = new Date()
    timer = setInterval(callback, interval)
    state = 1
  }

  this.start()
}

module.exports = InvervalTimer
