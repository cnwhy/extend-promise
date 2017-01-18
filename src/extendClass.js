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

	//defer  defer为最基础的实现
	if(isFunction(Promise) && isFunction(Promise.prototype.then)){
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
	}else if(isFunction(Promise.defer)){
		QClass.defer = function(){return Promise.defer();}
	}else if(isFunction(Promise.deferred)){
		QClass.defer = function(){return Promise.deferred();}
	}else{
		throw new TypeError("此类不支持扩展!")
	}

	//delay
	if(asbind("delay")){
		QClass.delay = function(ms,value){
			var defer = QClass.defer();
			setTimeout(function(){
				//console.log('==========')
				defer.resolve(value);
			},ms)
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
				var _p = promises[i];
				QClass.resolve(_p).then(function(d) {
					if(typeof count != 'undefined'){
						data.push(d);
					}else{
						data[i] = d;
					}
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
				if(promises.length == 0){defer.resolve(data)};
				for(var i = 0; i<promises.length; i++){
					fillData(i);
				}
			}else if(map && isPlainObject(promises)){
				var _mark = 0;
				data = {}
				for(var i in promises){
					fillData(i);
					_mark++;
				}
				if(_mark == 0) defer.resolve(data)
			}else{
				defer.reject(new TypeError("参数错误"));
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
			count = +count >= 0 ? +count : 0;
			return getall(false,count)(proArr)
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
			(function() {
				var _i = i;
				var _p = proArr[_i];
				QClass.resolve(_p).then(function(data) {
					defer.resolve(data);
				}, function(err) {
					defer.reject(err);
				})
			})()
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
		return defer.promise;
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
				throw TypeError('"args" is not Array')
			}
			return defer.promise;
		}
	}

	QClass.denodeify = function(f){
		var _this = this === QClass ? null : this;
		return function(){
			return nfcall.apply(_this,[].concat([f],arg2arr(arguments)))
		}
	}
	return QClass;
}
module.exports = extendClass;