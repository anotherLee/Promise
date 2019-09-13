function MyPromise(executor) {
  this.status = 'pending'
  this.data = undefined
  this.reason = undefined
  this.resolvedCallbacks = []
  this.rejectedCallbacks = []

  let resolve = (value) => {
    setTimeout(() => {
      if (this.status === 'pending') {
        this.status = 'fulfilled'
        this.data = value
        this.resolvedCallbacks.forEach(fn => fn(this.data))
      }
    })
  }
  let reject = (reason) => {
    setTimeout(() => {
      if (this.status === 'pending') {
        this.status = 'rejected'
        this.reason = reason
        this.rejectedCallbacks.forEach(fn => fn(this.reason))
      }
    })
  }
  executor(resolve, reject)
}

MyPromise.prototype.then = function (onResolved, onRejected) {
  if (typeof onResolved !== 'function') {
    onResolved = function(value) {
      return value
    }
  }

  if (typeof onRejected !== 'function') {
    onRejected = function(reason) {
      throw reason
    }
  }

  let promise2

  if (this.status === 'pending') {
    promise2 = new MyPromise((resolve, reject) => {
      function successFn(value) {
        try {
          let x = onResolved(value)
          resolve_promise(promise2, x, resolve, reject)
        } catch (e) {
          reject(e)
        }
      }

      function failFn(reason) {
        try {
          let x = onRejected(reason)
          resolve_promise(promise2, x, resolve, reject)
        } catch (e) {
          reject(e)
        }
      }

      this.resolvedCallbacks.push(successFn)
      this.rejectedCallbacks.push(failFn)
    })
  }

  if (this.status === 'fulfilled') {
    promise2 = new MyPromise((resolve, reject) => {
      setTimeout(() => {
        try {
          let x = onResolved(this.data)
          resolve_promise(promise2, x, resolve, reject)
        } catch (e) {
          reject(e)
        }
      })
    })
  }

  if (this.status === 'rejected') {
    promise2 = new MyPromise((resolve, reject) => {
      setTimeout(() => {
        try {
          let x = onRejected(this.reason)
          resolve_promise(promise2, x, resolve, reject)
        } catch (e) {
          reject(e)
        }
      })
    })
  }

  return promise2
}


// catch方法，实例方法
MyPromise.prototype.catch = function(failFn) {
  this.then(null, function(reason) {
    failFn(reason)
  })
}

// all方法，静态方法
MyPromise.all = function(arr) {
  return new MyPromise(function(resolve, reject) {
    let result = []
    for(let i=0; i<result.length; ++i) {
      let currentPromise = result[i]
      currentPromise.then(function(res) {
        result.push(res)
        if (result.length === arr.length) {
          resolve(result)
        }
      }, function(reason) {
        reject(reason)
      })
    }
  })
}

// race方法，静态方法
MyPromise.prototype.race = function(arr) {
  return new MyPromise(function(resolve, reject) {
    arr.forEach(promise => {
      promise.then(resolve, reject)
    })
  })
}

// resolve和reject，都是静态方法
MyPromise.resolve = function(value) {
  return new MyPromise(function(resolve, reject) {
    resolve(value)
  })
}

MyPromise.reject = function(reason) {
  return new MyPromise(function(resolve, reject) {
    reject(reason)
  })
}

function resolve_promise(promise2, x, resolve, reject) {
  if (x === promise2) {
    reject(new TypeError('Chaining cycle detected for promise'))
    return
  }
  if (x instanceof MyPromise) {
    x.then(function(v) {
      resolve_promise(promise2, v, resolve, reject)
    }, function(t) {
      reject(t)
    })
    return
  }
  if (x !== null && (typeof x === 'function' || typeof x === 'object')) {
    let called = false
    try {
      let then = x.then
      if (typeof then === 'function') {
        then.call(x, function resolvePromise(y) {
          if (called) return
          called = true
          resolve_promise(promise2, y, resolve, reject)
        }, function rejectPromise(r) {
          if (called) return
          called = true
          reject(r)
        })
      } else {
        resolve(x)
      }
    } catch (e) {
      if (called) return
      called = true
      reject(e)
    }
  } else {
    resolve(x)
  }
}

MyPromise.deferred = function() {
  let dfd = {}
  dfd.promise = new MyPromise(function(resolve, reject) {
    dfd.resolve = resolve
    dfd.reject = reject
  })
  return dfd
}

try {
  module.exports = MyPromise
} catch (e) {

}
