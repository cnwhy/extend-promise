/*!
 * extend-promise v0.0.3
 * Homepage https://github.com/cnwhy/extend-promise#readme
 * License BSD-2-Clause
 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (name, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define([], factory);
    } else if (typeof window !== "undefined" || typeof self !== "undefined") {
        var global = typeof window !== "undefined" ? window : self;
        global[name] = factory();
        if(typeof global.Promise == "function"){
        	global[name].auto(global.Promise);
        }
    } else {
        throw new Error("加载 " + name + " 模块失败！，请检查您的环境！")
    }
})('extendPromise',function(){
    var extendPromise = require("../index");
    extendPromise.auto = function(P){
        extendPromise.extendClass(P);
        extendPromise.extendPrototype(P);
    };
    return extendPromise;
});
},{"../index":2}],2:[function(require,module,exports){
module.exports = {
	extendClass : require("./src/extendClass"),
	extendPrototype : require("./src/extendPrototype")
};
},{"./src/extendClass":3,"./src/extendPrototype":4}],3:[function(require,module,exports){
'use strict';
var utils = require('./utils')
var isArray = utils.isArray
	,isEmpty = utils.isEmpty
	,isFunction = utils.isFunction
	,isPlainObject = utils.isPlainObject
	,arg2arr = utils.arg2arr

function extendClass(Promise,obj,funnames){
	var QClass,source;
	if(obj){
		source = true
		QClass = obj;
	}else{
		QClass = Promise;
	}

	function asbind(name){
		if(isArray(funnames)){
			var nomark = false;
			for(var i = 0; i<funnames.length; i++){
				if(funnames[i] == name){
					nomark = true;
					break;
				}
			}
			if(!nomark) return false;
		}
		if(source){
			return !isFunction(QClass[name]);
		}
		return true;
	}

	if(!QClass.Promise && Promise != obj) QClass.Promise = Promise;

	//defer
	if(isFunction(Promise.defer)){
		QClass.defer = Promise.defer
	}else if(isFunction(Promise.deferred)){
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
	if(asbind("delay")){
		QClass.delay = function(ms,value){
			var defer = QClass.defer();
			setTimeout(defer.resolve,ms,value)
			return defer.promise;
		}
	}

	//resolve
	if(asbind("resolve")){
		QClass.resolve = function(obj){
			var defer = QClass.defer();
			defer.resolve(obj);
			return defer.promise;
		}
	}

	//reject
	if(asbind("reject")){
		QClass.reject = function(obj){
			var defer = QClass.defer();
			defer.reject(obj);
			return defer.promise;
		}
	}

	function getall(map,count){
		if(!isEmpty(count)){
			count = +count > 0 ? +count : 0; 
		}
		return function(promises) {
			var defer = QClass.defer();
			var data,_tempI = 0;
			var fillData = function(i){
				var _p = promises[i]
				QClass.resolve(_p).then(function(d) {
					data[i] = d;
					if (--_tempI == 0 || (!map && count && data.length>=count)) {
						defer.resolve(data);
					}
				}, function(err) {
					if (isEmpty(count)) {
						defer.reject(err);
					}else if(--_tempI == 0){
						defer.resolve(data);
					}
				})
				_tempI++;
			}
			if(isArray(promises)){
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
	if(asbind("all")){
		QClass.all = getall()
	}

	if(asbind("allMap")){
		QClass.allMap = getall(true);
	}

	if(asbind("some")){
		QClass.some = function(proArr,count){
			return getall(false,count||0)(proArr)
		}
	}

	//map
	if(asbind("map")){
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

	function race(proArr) {
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

	//any | race
	if(asbind("race")){
		QClass.race = race;
	}
	if(asbind("any")){
		QClass.any = race;
	}

	/*封装CPS*/
	//callback Adapter 
	function cbAdapter(defer){
		return function(err,data){
			if(err) return defer.reject(err);
			defer.resolve(data)
		}
	}
	function nfcall(f){
		var _this = this === QClass ? null : this;
		var defer = QClass.defer();
		var argsArray = arg2arr(arguments,1)
		argsArray.push(cbAdapter(defer))
		f.apply(_this,argsArray)
	}


	if(asbind("nfcall")){
		QClass.nfcall = nfcall;
	}

	if(asbind("nfapply")){
		QClass.nfapply = function(f,args){
			var _this = this === QClass ? null : this;
			var defer = QClass.defer();
			if(isArray(args)){
				args.push(cbAdapter(defer));
				f.apply(_this,args)
			}else{
				throw "args TypeError"
			}
			return defer.promise;
		}
	}

	QClass.denodeify = function(f){
		var _this = this === QClass ? null : this;
		return function(){
			return nfcall.call(_this,f,arg2arr(arguments))
		}
	}
	return QClass;
}
module.exports = extendClass;
},{"./utils":5}],4:[function(require,module,exports){
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
	prototype.catchOf = function(errType,fn){
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
},{}],5:[function(require,module,exports){
'use strict';
exports.isPlainObject = function(obj) {
	if (obj === null || typeof(obj) !== "object" || obj.nodeType || (obj === obj.window)) {
		return false;
	}
	if (obj.constructor && !Object.prototype.hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")) {
		return false;
	}
	return true;
}

exports.isArray = function(obj){
	return Object.prototype.toString.call(obj) == "[objece Array]"
}

exports.isFunction = function(obj){
	return typeof obj == "function"
}

exports.isEmpty = function(obj){
	return typeof obj == 'undefined' || obj === null;
}

exports.arg2arr = function(arg,b,s){
	return Array.prototype.slice.call(arg,b,s);
}
},{}]},{},[1])