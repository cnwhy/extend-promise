var assert = require("assert");
var promise = Promise;//require('easy-promise');
var utils = require('../src/utils');
var EP = require("../");
var Q = EP.extendClass(promise,{})
var typeTest = require('./tutils.js');

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

describe('Promise 对像扩展测试', function(){
	describe('.defer() 测试',function(){
		it('同步',function(done){
			var defer = Q.defer();
			defer.resolve(1);
			defer.promise.then(function(v){
				assert.equal(1,v);
				done()
			})
		})
		it('异步',function(done){
			var defer = Q.defer();
			setTimeout(function(){
				defer.resolve(1);
			},0);
			defer.promise.then(function(v){
				assert.equal(1,v);
				done()
			})
		})
		typeTest(function(typename,promise,value){
			it('resolve(Type) Type 为 ' + typename , function(done){
				var defer = Q.defer();
				defer.resolve(promise);
				defer.promise.then(succ(value,done))
			})
		})

	})
	
	describe('resolve 转promise对像',function(){
		typeTest(function(typename,promise,value){
			it('resolve(Type) Type 为 ' + typename , function(done){
				Q.resolve(promise).then(succ(value,done))
			})
		})
	})

	describe('delay 延迟返回',function(){

		// typeTest(function(typename,promise,value){
		// 	it('delay(time,value) Type 为 ' + typename , function(done){
		// 		Q.delay(0,promise).then(succ(value,done))
		// 	})
		// })
		it('#delay 延迟测试', function(done){
			var data1 = new Date(),cp = 200;
			Q.delay(cp).then(function(){
				if((Math.abs(new Date - data1) - cp) / cp > 0.1) return done("延迟误差过大！") 
				done();
			})
		});
		it('#delay 延迟测试 值测试', function(done){
			var data1 = new Date(),cp = 200;
			Q.delay(cp,3).then(function(v){
				assert.equal(v,3);
				if((Math.abs(new Date - data1) - cp) / cp > 0.1) return done("延迟误差过大！") 
				done();
			})
		});
	})

	describe('all promise队列解决',function(){
		it('#all([])', function(done){
			Q.all([]).then(function(v){
				assert.ok(utils.isArray(v) && v.length == 0);
				done()
			})
		})
		typeTest(function(typename,promise,value){
			it('#all([Type]) Type 为 ' + typename , function(done){
				Q.all([promise]).then(function(v){
					assert.ok(utils.isArray(v));
					assert.equal(v[0],value);
					done();
				})
			})
		})
	})

	describe('allMap promise Map对像解决',function(){
		it('#allMap({})', function(done){
			Q.allMap({}).then(function(v){
				assert.deepEqual(v,{},err);
				done()
			},err(done,"错误调用"))
		})
		typeTest(function(typename,promise,value){
			it('#allMap({a:Type}) Type 为 ' + typename , function(done){
				Q.allMap({a:promise}).then(function(v){
					assert.deepEqual(v,{a:value});
					done();
				})
			})
		})
	});

	describe('some 最快解决',function(){
		function getParr(){
			var arr = [];
			arr.push(Q.delay(30,3))
			arr.push(Q.delay(20,2))
			arr.push(Q.delay(40,4))
			arr.push(Q.delay(10,1))
			arr.push(Q.delay(0,0))
			return arr;
		}

		it('无err', function(done){
			var arr = getParr();			
			Q.some(arr,3).then(function(v){
				assert.ok(utils.isArray(v));
				assert.equal(v.join(","),"0,1,2","errr");
				done();
			}).then(null,err(done))
		})
		it('有err', function(done){
			var arr = getParr();
			arr.push(Q.reject("err"));
			arr.push(Q.delay(10,Q.reject("err")));			
			Q.some(arr,3).then(function(v){
				assert.ok(utils.isArray(v));
				assert.equal(v.join(","),"0,1,2","errr");
				done();
			}).then(null,err(done))
		})
		it('无第二个参数', function(done){
			var arr = getParr();
			Q.some(arr).then(function(v){
				assert.ok(utils.isArray(v))
				assert.equal(v.join(","),"0,1,2,3,4");
				done();
			},err(done))
		})
		it('第二个参数大于数组长度', function(done){
			var arr = getParr();
			Q.some(arr).then(function(v){
				assert.ok(utils.isArray(v))
				assert.equal(v.join(","),"0,1,2,3,4");
				done();
			},err(done))
		})
	})

	describe('map 数组映射处理',function(){
		it('#同步', function(done){
			Q.map([0,1,2],function(v){
				return v
			}).then(function(v){
				assert.ok(utils.isArray(v));
				assert.equal(v.join(","),"0,1,2","errr");
				done();
			}).then(null,err(done))
		})
		it('#异步', function(done){
			Q.map([0,1,2],function(v){
				return Q.delay(Math.random()*100,v);
			}).then(function(v){
				assert.ok(utils.isArray(v));
				assert.equal(v.join(","),"0,1,2","errr");
				done();
			}).then(null,err(done))
		})
		it('#定义并发', function(done){
			var temp = [];
			Q.map([0,1,2],function(v){
				return Q.delay(Math.random()*100,v).then(function(v){
					temp.push(v)
					return v;
				})
			},{concurrency:1}).then(function(v){
				assert.ok(utils.isArray(v));
				assert.equal(v.join(","),"0,1,2");
				assert.equal(temp.join(","),"0,1,2","并发错误");
				done();
			}).then(null,err(done))
		})
	})

	describe('race ',function(){
		//it('')race
	})
	
	describe('CPS 转 Promise',function(){
		var FS = require("fs");
		it('#nfcall (promise风格化CPS)', function(done){
			Q.nfcall(FS.readFile, __dirname + "/1.txt", "utf-8").then(succ('1.txt',done),err(done,"错误调用"));
		});
		it('#nfapply (promise风格化CPS)', function(done){
			Q.nfapply(FS.readFile, [__dirname + "/1.txt", "utf-8"]).then(succ('1.txt',done),err(done,"错误调用"));
		});
		it('#denodeify 封装CPS函数', function(done){
			var readFile = Q.denodeify(FS.readFile);
			readFile(__dirname + "/1.txt", "utf-8").then(succ('1.txt',done),err(done,"错误调用"));
		});
	})
})