const PENDING = 'PENDING';
const FULFILLED = 'FULFILLED';
const REJECTED = 'REJECTED';

class Promise {
  constructor(executor) {
    this.status = PENDING;
    this.value = undefined;
    this.reason = undefined;
    this.onResolveCallbacks = [];
    this.onRejectedCallbacks = [];

    let resolve = (value) => {
      if(this.status === PENDING) {
        if(value instanceof Promise){
          // 递归解析 
          return value.then(resolve,reject)
        }
        this.status = FULFILLED;
        this.value = value;
        this.onResolveCallbacks.forEach(fn=>fn())
      }
    }

    let reject = (reason) => {
      if(this.status === PENDING) {
        this.status = REJECTED;
        this.reason = reason;
        this.onRejectedCallbacks.forEach(fn=>fn())
      }
    }

    try {
      executor(resolve, reject)
    } catch(e) {
      reject(e)
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled: v=>v;
    onRejected = typeof onRejected === 'function' ? onRejected: err => {throw err};
    let promise2 = new Promise((resolve, reject) => {
      if(this.status === FULFILLED) {
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value);
            resolvePromise(promise2,x,resolve,reject)
          } catch(e) {
            reject(e)
          }
        }, 0)
      }

      if(this.status === REJECTED) {
        setTimeout(() => {
          try {
            let x= onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch(e) {
            reject(e)
          }
        }, 0)
      }

      if(this.status === PENDING) {
        this.onResolveCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onFulfilled(this.value);
              resolvePromise(promise2,x,resolve,reject)
            } catch(e) {
              reject(e)
            }
          }, 0)
        })

        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x= onRejected(this.reason);
              resolvePromise(promise2, x, resolve, reject);
            } catch(e) {
              reject(e)
            }
          }, 0)
        })
      }
    })
    return promise2;
  }
}



function resolvePromise(promise2, x, resolve, reject) {
  if(promise2 === x) {
    return reject(new TypeError('Chaining cycle detected for promise #<Promise>'))
  }
  let called;
  if((typeof x === 'object' && x!=null) || typeof x ==='function') {
    try {
      let then = x.then;
      if(typeof then === 'function') {
        then.call(x, y=> {
          if(called) return;
          called = true;
          resolvePromise(promise2, y, resolve, reject);
        }, r=>{
          if(called) return;
          called = true;
          reject(r);
        })
      } else {
        resolve(x)
      }
    } catch(e) {
      if(called) return;
      called = true;
      reject(e)
    }
  } else {
    resolve(x)
  }
}

Promise.prototype.finally = function(callback) {
  return this.then(value => {
    return Promise.resolve(callback()).then(()=>value);
  },(reason) => {
    return Promise.resolve(callback()).then(() => {throw reason});
  })
}






Promise.all = function(values) {
  if(!Array.isArray(values)) {
    const type = typeof values;
    return new TypeError(`TypeError: ${type} ${values} is not iterable`)
  }
  return new Promise((resolve, reject)=> {
    let resultArr = [];
    let orderIndex = 0;
    const processResultByKey = (value, index) => {
      resultArr[index] = value;
      if(++orderIndex === values.length) {
        resolve(resultArr)
      }
    }

    for(let i=0;i<values.length;i++) {
      let value = values[i]
      if(value && typeof value.then === 'function') {
        value.then(value=>{
          processResultByKey(value, i)
        }, reject)
      } else {
        processResultByKey(value, i)
      }
    }
  })
}

Promise.race = function(promises) {
  return new Promise((resolve, reject) => {
    for(let i=0;i<promises.length;i++) {
      let val = promises[i];
      if(val && typeof val.then === 'function') {
        val.then(resolve,reject)
      } else {
        resolve(val)
      }
    }
  })
}

let p1 = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('ok1');
  }, 1001);
})

let p2 = new Promise((resolve, reject) => {
  setTimeout(() => {
    reject('ok2');
  }, 1000);
})

Promise.race([p1,p2]).then(data => {
  console.log('resolve', data);
}, err => {
  console.log('reject', err);
})










































































































































































































































































































































































































Promise.defer = Promise.deferred = function () {
  let dfd = {};
  dfd.promise = new Promise((resolve, reject) => {
    dfd.resolve = resolve;
    dfd.reject = reject;
  });
  return dfd;
}
module.exports = Promise;