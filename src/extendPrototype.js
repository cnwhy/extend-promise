function extendPrototype(Promise){
	var prototype = Promise.prototype;
	prototype.done = function(ok,no){
		this.then(function(value){
			if(typeof ok == "function") setTimeout(function(){ok(value)},0);
		},function(err){
			if(typeof no == "function") setTimeout(function(){no(err)},0)
			else setTimeout(function(){throw err;},0)
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
	prototype['finally'] = function(fn){
		if(typeof fn !== "function") return this;
		return this.then(function(v){
			return Promise.resolve(fn()).then(function(){return v})
		},function(err){
			return Promise.resolve(fn()).then(function(){throw err;})
		});
	}
	return Promise;
}
module.exports = extendPrototype;