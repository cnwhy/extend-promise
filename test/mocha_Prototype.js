var assert = require("assert");
var promise = typeof Promise != 'undefined' ? Promise : require('easy-promise');
var utils = require('../src/utils');
var EP = require("../");
var typeTest = require('./tutils.js');
promise = EP.extendPrototype(promise);
var Q = EP.extendClass(promise,{});

var succ = function(k,done,xc){
		return function(data){
			xc && clearTimeout(xc)
			if(data !== k) return done("返回参数错误");
			done();
		}
	}
	,err = function(done,err,xc){
		return function(err){
			xc && clearTimeout(xc)
			done(err || "调用错误");
		}
	};

describe('Promise 原型扩展', function(){
	describe('.catch() ',function(){
		describe('resolve 不触发', function(){
			typeTest(function(typename,promise,value){
				it('resolve 情况为: ' + typename , function(done){
					var defer = Q.defer();
					defer.resolve(promise);
					defer.promise.catch(err(done)).then(succ(value,done))
				})
			},true)
		})
		describe('reject 触发', function(){
			typeTest(function(typename,promise,value){
				it('捕获 reject 情况为: ' + typename , function(done){
					var defer = Q.defer();
					defer.resolve(promise);
					defer.promise.then(function(v){throw v;}).catch(succ(value,done))
				})
			},false)
		})
	});
	describe('.catchOf({errType},{rejectFun}) ',function(){
		describe('resolve 不触发', function(){
			typeTest(function(typename,promise,value){
				it('resolve 情况为: ' + typename , function(done){
					var defer = Q.defer();
					defer.resolve(promise);
					defer.promise.catchOf(err(done)).then(succ(value,done))
				})
			},true)
		})
		describe('reject 相等触发', function(){
			typeTest(function(typename,promise,value){
				it('reject 为 ' + typename , function(done){
					var defer = Q.defer();
					defer.resolve(promise);
					defer.promise.then(function(v){throw v;}).catchOf(value,succ(value,done))
				})
			},false)
		})
		describe('instanceof 情况测试', function(){
			it('类的实例化' , function(done){
				var rerr = new Error("err");
				Q.reject(rerr).catchOf(Error,succ(rerr,done)).then(null,err(done))
			})
			it('继承类的实例化' , function(done){
				var rerr = new TypeError("typeerr");
				Q.reject(rerr).catchOf(Error,succ(rerr,done)).then(null,err(done))
			})
			it('不同类的实例化' , function(done){
				var rerr = new Error("err");
				Q.reject(rerr).catchOf(Date,err(done)).then(null,succ(rerr,done))
			})
		})
		describe('.error() 语法糖',function(){
			it('Error',function(done){
				var rerr = new Error("err");
				Q.reject(rerr).error(succ(rerr,done)).then(null,err(done))
			})
			it('Error 继承类',function(done){
				var rerr = new TypeError("typeerr");
				Q.reject(rerr).error(succ(rerr,done)).then(null,err(done))
			})
			it('非Error' , function(done){
				var rerr = {err:"err"};
				Q.reject(rerr).error(err(done)).then(null,succ(rerr,done))
			})
		})
	})

	describe('.finally() ',function(){
		describe('resolve 触发', function(){
			typeTest(function(typename,promise,value){
				it('resolve 情况为: ' + typename , function(done){
					var mark = false;
					var defer = Q.defer();
					defer.resolve(promise);
					defer.promise.finally(function(v,e){
						mark = true;
					}).then(function(v){
						assert.ok(mark,"触发 finali");
						succ(value,done)(v);
					},err(done))
				})
			},true)
		})
		describe('reject 触发', function(){
			typeTest(function(typename,promise,value){
				it('reject 情况为: ' + typename , function(done){
					var mark = false;
					var defer = Q.defer();
					defer.resolve(promise);
					defer.promise.then(function(v){throw v;}).finally(function(v,e){
						mark = true;
					}).then(err(done),function(e){
						assert.ok(mark,"触发 finali");
						succ(value,done)(e);
					})
				})
			},false)
		})
	})
	describe('.done() ',function(){
		it('resolve',function(done){
			var c = promise.resolve(1).done(succ(1,done),function(err){})
			assert.ok(typeof c  == "undefined");
		})
		it('reject',function(done){
			var c = promise.reject(1).done(err(done),succ(1,done))
			assert.ok(typeof c  == "undefined");
		})
		// it('reject notry',function(done){
		// 	var domain = require('domain');
		// 	var d  = domain.create();
		// 	//监听domain的错误事件,异步错误；
		// 	//
		// 	var p = promise.reject(1);
		// 	d.on('error', function(err) {
		// 		console.log(err);
		// 		succ(1,done)(err);
		// 		d.dispose();
		// 	});
		// 	d.add(promise.prototype);
		// 	d.add(p.then);
		// 	d.add(EP.extendPrototype);
		// 	d.run(function(){
		// 		var c = p.done(err(done));
		// 		assert.ok(typeof c  == "undefined");
		// 	})
		// })
	})
})