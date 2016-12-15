/*!
 * extend-promise v0.0.1
 * Homepage https://github.com/cnwhy/extend-promise#readme
 * License BSD
 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (name, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define([], factory);
    } else if (typeof window !== "undefined" || typeof self !== "undefined") {
        var global = typeof window !== "undefined" ? window : self;
        global[name] = factory();
    } else {
        throw new Error("加载 " + name + " 模块失败！，请检查您的环境！")
    }
})('Promise',function(){
    var Promise = require("../promise/setTimeout")
    return Promise;
});
},{"../promise/setTimeout":4}],2:[function(require,module,exports){
module.exports = require("./src")(function(fn){setTimeout(fn,0)});
},{"./src":3}],3:[function(require,module,exports){
"use strict";
//参考官方代码示例改动
module.exports = function(nextTick){
	function Resolve(promise, x) {
		if(x instanceof Promise_){
			x.then(promise.resolve,promise.reject)
		};
		if (x && (typeof x === 'function' || typeof x === 'object')) {
			var called = false,then;
			try {
				then = x.then;
				if (typeof then === 'function') {
					then.call(x, function(y) {
						if (called) return;
						called = true;
						Resolve(promise, y);
					}, function(r) {
						if (called) return;
						called = true;
						promise.reject(r);
					});
				}else {
					promise.resolve(x);
				}
			}catch (e) {
				if (!called) {
					called = true;
					promise.reject(e);
				}
			}
		}else {
			promise.resolve(x);
		}
	}

	function Promise_(fun){
		//var defer = this.defer = new Defer(this);
		var self = this;
		this.status = -1;  //pending:-1 ; fulfilled:1 ; rejected:0
		this._events = [];
		var lock = false;
		function _resolve(value){
			changeStatus.call(self,1,value)
		}
		function _reject(reason){
			changeStatus.call(self,0,reason)
		}
		this.resolve = function(value){
			if(lock) return;
			lock = true;
			if(self === value){
				return _reject(new TypeError("The promise and its value refer to the same object"));
			} 
			// if(value instanceof Promise_){
			// 	value.then(_resolve,_reject)
			// }else{
			Resolve({resolve:_resolve,reject:_reject},value)
			//}
		}
		this.reject = function(reason){
			if(lock) return;
			lock = true;
			_reject(reason);
		}
		if(typeof fun == "function"){
			try{
				fun(this.resolve,this.reject);
			}catch(e){
				this.reject(e)
			}
		}
	}

	Promise_.defer = function(){
		var _resolve,_reject;
		var _promise = new Promise_(function(ok,no){
			_resolve = ok;
			_reject = no;
		});
		return {
			promise: _promise,
			resolve: _resolve,
			reject: _reject
		}
	}

	Promise_.resolve = function(obj){
		if(obj instanceof Promise_) return obj;
		return new Promise_(function(ok,no){
			ok(obj);
		})
	}

	Promise_.reject = function(err){
		return new Promise_(function(ok,no){
			no(err);
		})
	}

	Promise_.prototype.then = function(ok,no){
		var status = this.status;
		var defer = Promise_.defer()
			,promise = defer.promise
			
		// if(!~status){
		//  this.events.push([ok,no,promise]);
		// }else if(status && typeof ok == "function"){
		//  runThen(ok,this.value,promise,status);
		// }else if(!status && typeof no == "function"){
		//  runThen(no,this.reason,promise,status)
		// }else{
		//  if(status) defer.resolve(this.value)
		//  else defer.reject(this.reason);
		// }

		this._events.push([ok,no,promise]);
		runThens.call(this)
		return promise;
	}

	function changeStatus(status,arg){
		var self = this;
		if(~this.status) return;
		this.status = status;
		if(status){
			this.value = arg
		}else{
			this.reason = arg;
		}
		nextTick(function(){
			runThens.call(self)
		})
	}

	function runThens(){
		if(!~this.status) return;
		var self = this
			,_event = self._events
			,arg = self.status ? self.value : self.reason
			,FnNumb = self.status ? 0 : 1;
		while(_event.length){
			(function(eArr){
				var resolve,reject
				var fn = eArr[FnNumb]
					,nextQ = eArr[2]
				runThen(fn,arg,nextQ,self.status);
			})(_event.shift())
		}
	}

	function runThen(fn,arg,nextQ,status){
		var resolve,reject
		if(nextQ){
			resolve = nextQ.resolve
			reject = nextQ.reject 
		}
		if(typeof fn == 'function'){
			nextTick(function(){
				var nextPromise;
				try{
					nextPromise = fn(arg)
				}catch(e){
					if(reject) reject(e)
					else throw e;
					return;
				}
				if(resolve) resolve(nextPromise);
			})
		}else if(nextQ){
			if (status) resolve(arg)
			else reject(arg)
		}
	}
	return Promise_;
}
},{}],4:[function(require,module,exports){
var Promise = require('easy-promise/setTimeout');
module.exports = require('../src/polyfills')(Promise);
},{"../src/polyfills":7,"easy-promise/setTimeout":2}],5:[function(require,module,exports){
function isPlainObject(obj) {
	if (obj === null || typeof(obj) !== "object" || obj.nodeType || (obj === obj.window)) {
		return false;
	}
	if (obj.constructor && !Object.prototype.hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")) {
		return false;
	}
	return true;
}
function extendClass(Promise,obj){
	var QClass;
	if(obj){
		QClass = obj;
	}else{
		QClass = Promise;
	}

	if(!QClass.Promise && Promise != obj) QClass.Promise = Promise;

	//defer
	if(typeof Promise.defer == "function"){
		QClass.defer = Promise.defer
	}else if(typeof Promise.deferred == "function"){
		QClass.defer = Promise.deferred
	}else{
		QClass.defer = function() {
			var resolve, reject;
			var promise = new Promise(function(_resolve, _reject) {
				resolve = _resolve;
				reject = _reject;
			});
			return {
				promise: promise,
				resolve: resolve,
				reject: reject
			};
		}
	}

	//delay
	if(typeof Promise.delay == "function"){
		QClass.delay = Promise.delay;
	}else{
		QClass.delay = function(ms,value){
			var defer = QClass.defer();
			setTimeout(defer.resolve,ms,value)
			return defer.promise;
		}
	}

	//resolve
	if(typeof Promise.resolve == "function"){
		QClass.resolve = Promise.resolve;
	}else{
		QClass.resolve = function(obj){
			var defer = QClass.defer();
			defer.resolve(obj);
			return defer.promise;
		}
	}

	//reject
	if(typeof Promise.reject == "function"){
		QClass.reject = Promise.reject;
	}else{
		QClass.reject = function(obj){
			var defer = QClass.defer();
			defer.reject(obj);
			return defer.promise;
		}
	}

	function getall(map,count){
		count = +count > 0 ? +count : 0; 
		return function(promises) {
			var defer = QClass.defer();
			var data,_tempI = 0;
			var fillData = function(i){
				var _p = promises[i]
				QClass.resolve(_p).then(function(d) {
					if(map || !count (count && data.length<count)) data[i] = d;
					if (--_tempI == 0 || (!map && count && data.length>=count)) {
						defer.resolve(data);
					}
				}, function(err) {
					if (typeof count == "undefined") {
						defer.reject(err);
					}else if(--_tempI == 0){
						defer.resolve(data);
					}
				})
				_tempI++;
			}
			if(Object.prototype.toString.call(promises) === '[object Array]'){
				data = [];
				for(var i = 0; i<promises.length; i++){
					fillData(i);
				}
			}else if(map && isPlainObject(promises)){
				data = {}
				for(var i in promises){
					fillData(i);
				}
			}else{
				defer.reject(new TypeError());
			}
			return defer.promise;
		}
	}

	//all 
	if(typeof Promise.all == "function"){
		QClass.all = Promise.all;
	}else{
		QClass.all = getall()
	}

	if (typeof Promise.allMap == "function") {
		QClass.allMap = Promise.allMap;
	} else {
		QClass.allMap = getall(true);
	}

	QClass.some = function(proArr,count){
		return getall(false,count||0)(proArr)
	}

	//map
	if(typeof Promise.map == "function"){
		QClass.map = Promise.map;
	}else{
		QClass.map = function(data,mapfun,options){
			var defer = QClass.defer();
			var promiseArr = [];
			var concurrency = options ? +options.concurrency : 0
			//无并发控制
			if(concurrency == 0 || concurrency != concurrency){
				for(var i in data){
					promiseArr.push(mapfun(data[i],i,data));
				}	
				QClass.all(promiseArr).then(defer.resolve,defer.reject)
				return defer.promise;
			}
			var k = 0;
			var keys = (function(){
				var ks = [];
				for(var k in data){
					ks.push(k);
				}
				return ks;
			})();
			function next(){
				if(k<keys.length){
					var key = keys[k];
					var promise = QClass.resolve(mapfun(data[key],key,data)).then(function(v){
						next();
						return v;
					},defer.reject);
					promiseArr.push(promise);
					concurrency--;
					k++;
				}else{
					QClass.all(promiseArr).then(defer.resolve,defer.reject);
				}
			}
			do{
				next()
			}while(concurrency>0 && k<keys.length)

			return defer.promise
		}
	}

	//any | race
	if(typeof Promise.race == "function"){
		QClass.race = QClass.any = Promise.race;
	}else if(typeof Promise.any == "function"){
		QClass.race = QClass.any = Promise.any
	}else{
		QClass.race = QClass.any = function(proArr) {
			var defer = QClass.defer();
			for (var i = 0; i < proArr.length; i++) {
				+ function() {
					var _i = i;
					//nextTick(function() {
						var _p = proArr[_i];
						QClass.resolve(_p).then(function(data) {
							defer.resolve(data);
						}, function(err) {
							defer.reject(err);
						})
					//}, 0)
				}()
			}
			return defer.promise;
		}
	}

	/*封装CPS*/
	//callback Adapter 
	function cbAdapter(defer){
		return function(err,data){
			if(err) return defer.reject(err);
			defer.resolve(data)
		}
	}
	QClass.nfcall = function(f){
		var _this = this === QClass ? null : this;
		var defer = QClass.defer();
		var argsArray = Array.prototype.slice.call(arguments,1)
		argsArray.push(cbAdapter(defer))
		f.apply(_this,argsArray)
		return defer.promise;
	}

	QClass.nfapply = function(f,args){
		var _this = this === QClass ? null : this;
		var defer = QClass.defer();
		if(Object.prototype.toString.call(args) === '[object Array]'){
			args.push(cbAdapter(defer));
			f.apply(_this,args)
		}else{
			throw "args TypeError"
		}
		return defer.promise;
	}

	QClass.denodeify = function(f){
		var _this = this === QClass ? null : this;
		return function(){
			return QClass.nfapply.call(_this,f,Array.prototype.slice.call(arguments))
		}
	}
	return QClass;
}
module.exports = extendClass;
},{}],6:[function(require,module,exports){
function extendPrototype(Promise){
	var prototype = Promise.prototype;
	prototype.done = function(ok,no){
		this.then(function(value){
			if(typeof ok == "function") setTimeout(function(){ok(value)},0);
		},function(err){
			if(typeof no == "function") setTimeout(function(){no(err)},0)
			else throw err;
		})
	}
	prototype.spread = function(ok,no){
		return this.then(function(value){
			return ok.apply(null,value);
		},no);
	}
	prototype.fail = 
	prototype['catch'] = function(no){
		return this.then(null,no);
	}
	/**
	 * 捕获指定错误
	 * @param  {object}   errType 错误类型/错误的值
	 * @param  {Function} fn      处理函数,拒绝值做为参数传入
	 * @return {Promise}           
	 */
	Prototype.catchOf = function(errType,fn){
		fn = fn || errType;
		return this.then(null,function(err){
			var futype = typeof fn;
			if(futype != "function"){throw err;}
			if(errType === fn){
				return fn(err);
			}
			if(errType === err || (typeof errType == 'function' && err instanceof errType)){
				return fn(err);
			}else{
				throw err;
			}
		});
	}
	prototype.error = function(no){
		return this.catchOf(Error,no);
	}
	/**
	 * 不管状态,必定执行,且装态继续传递
	 * @param  {[type]} fun [description]
	 * @return {Promise}
	 */
	prototype.fin =
	prototype['finally'] = function(fun){
		var run = function(y,n){try{fun(y,n);}catch(e){}}
		return this.then(function(data){
			run(data);
			return data;
		},function(err){
			run(null,err);
			throw err;
		})
	}
	return Promise;
}
module.exports = extendPrototype;
},{}],7:[function(require,module,exports){
module.exports = function(Promise){
	require("../src/extendClass")(Promise),
	require("../src/extendPrototype")(Promise)
	return(Promise)
}
},{"../src/extendClass":5,"../src/extendPrototype":6}]},{},[1])