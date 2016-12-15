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
        // var global = typeof window !== "undefined" ? window : self;
        // global[name] = factory();
        // if(typeof global.Promise == "function"){
        // 	global[name].auto(global.Promise);
        // }
    } else {
        throw new Error("加载 " + name + " 模块失败！，请检查您的环境！")
    }
})('extendPromise',function(){
    var global = typeof window !== "undefined" ? window : self;
    if(typeof global.Promise !== "function") throw Error('需要Promise,但未找到,请尝试使用"promise-full.js"');
    var P = require("../src/polyfills")(global.Promise)
    return P;
});
},{"../src/polyfills":4}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
module.exports = function(Promise){
	require("../src/extendClass")(Promise),
	require("../src/extendPrototype")(Promise)
	return(Promise)
}
},{"../src/extendClass":2,"../src/extendPrototype":3}]},{},[1])