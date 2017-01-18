var assert = require("assert");
var q = require('../lib/promise');
var maxtime = 50

//同步函数
function fun1(i,err){
	var deferred = q.defer();
	if(err){
		deferred.reject(err)
	}else{
		deferred.resolve(i)
	}
	return deferred.promise;
}
//异步函数
function fun2(i,err){
	var deferred = q.defer();
	setTimeout(function(){
		if(err){
			deferred.reject(err)
		}else{
			deferred.resolve(i)
		}
	},maxtime)
	//},(Math.random() * maxtime)>>0)
	return deferred.promise;
}

var succ = function(k,done,xc){
		return function(data){
			xc && clearTimeout(xc)
			if(data !== k){
				return done("返回参数错误");
			}
			done();
		}
	}
	,err = function(done,xc){
		return function(err){
			xc && clearTimeout(xc)
			done("回调错误");
		}
	}
	,timeout_succ = function(done,c){
		c = c ? c : 1;
		return setTimeout(function(){
				done();
			},(maxtime+100)*c)
	}
	,timeout_err = function(done,errmsg,c){
		c = c ? c : 1;
		return setTimeout(function(){
				done(errmsg);
			},(maxtime+100)*c)
	}

//普通测试
describe("原型扩展测试", function(){
	describe('#then/when', function(){
		it('.then(succ) 同步函数执行 成功', function(done){
			var xc = timeout_err(done,"未成功调用succ");
			fun1(1).then(succ(1,done,xc))
		})
		it('.then(succ) 同步函数执行 失败', function(done){
			var xc = timeout_succ(done);
			fun1(1,2).then(err(done,xc))
		})
		it('.then(succ) 异步函数执行 成功', function(done){
			var xc = timeout_err(done,"未成功调用succ");
			fun2(1).then(succ(1,done,xc))
		})
		it('.then(succ) 异步函数执行 失败', function(done){
			var xc = timeout_succ(done);
			fun2(1,2).then(err(done,xc))
		})
		it('.then(succ,err) 同步函数执行 成功', function(done){
			var xc = timeout_err(done,"未成功调用succ");
			fun1(1).then(succ(1,done,xc),err(done,xc))
		})
		it('.then(succ,err) 同步函数执行 失败', function(done){
			var xc = timeout_err(done,'未成功调用err');
			fun1(1,2).then(err(done,xc),succ(2,done,xc))
		})
		it('.then(succ,err) 异步函数执行 成功', function(done){
			var xc = timeout_err(done,"未成功调用succ");
			fun2(1).then(succ(1,done,xc),err(done,xc))
		})
		it('.then(succ,err) 异步函数执行 失败', function(done){
			var xc = timeout_err(done,'未成功调用err');
			fun2(1,2).then(err(done,xc),succ(2,done,xc))
		})
	})
	describe('#done', function(){
		it('.done(succ) 成功', function(done){
			var xc = timeout_err(done,"未成功调用succ");
			fun2(1).done(succ(1,done,xc))
		})
		it('.done(succ,err) 成功', function(done){
			var xc = timeout_err(done,'未成功调用err');
			fun2(1).done(succ(1,done,xc),err(done,xc))
		})
		it('.done(succ,err) 失败', function(done){
			var xc = timeout_succ(done);
			fun2(1,2).done(err(done,xc),succ(2,done,xc))
		})
		it('.done(null,err) 成功', function(done){
			var xc = timeout_succ(done);
			fun2(1).done(null,err(done,xc))
		})
		it('.done(null,err) 失败', function(done){
			var xc = timeout_err(done,'未成功走完流程');
			fun2(1,2).done(null,succ(2,done,xc))
		})
	})
	describe('#fail/catch', function(){
		it('.fail(err) 成功', function(done){
			var xc = timeout_succ(done);
			fun2(1).fail(err(done,xc))
		})
		it('.fail(err) 失败', function(done){
			var xc = timeout_err(done,"未成功调用err");
			fun2(1,2).fail(succ(2,done,xc))
		})
	})
	describe('#fin/finally', function(){
		it('.finally() 成功后执行', function(done){
			var xc = timeout_err(done,"执行错误");
			var fin = 0;
			fun2(1).finally(function(){
				return fin = 1;
			}).then(function(data){
				if(fin !== 1) throw "执行错误";
				succ(1,done,xc)(data)
			},err(done,xc))
		})
		it('.finally() 失败后执行', function(done){
			var xc = timeout_err(done,"未成功调用err");
			var fin = 0;
			fun2(1,2).finally(function(){
				return fin = 1;
			}).then(err(done,xc),succ(2,done,xc))
		})
	})
});
