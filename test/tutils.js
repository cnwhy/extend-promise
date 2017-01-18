var getThenable = function(status,v,async){
	return {
		then: (function(){
			return function(ok,no){
				var run = function(){	
					if(status){
						ok(v);
					}else{
						no(v);
					}
				}
				if(async){
					setTimeout(run,0);
				}else{
					run();
				}
			}
		})()
	}
}

var getThenableQT = function(status,v,async){
	return getThenable(true,getThenable(status,v,async));
}

function typeTest(fun,status){
	status = typeof status == 'undefined' ? true : status;
	var baseobj = {}, basefn = function(){};
	var error = new Error("test");
	var baseValue = [
		{
			name : "null",
			value : null,
			then : null
		},{
			name : "undefined",
			value : undefined,
			then : undefined
		},{
			name : "number",
			value : 1,
			then : 1
		},{
			name : "string",
			value : "string",
			then : "string"
		},{
			name : "bool",
			value : true,
			then : true
		},{
			name : "普通 object",
			value : baseobj,
			then :baseobj
		},{
			name : "普通 error",
			value : error,
			then :error
		},{
			name : "普通 function",
			value : basefn,
			then : basefn
		},{
			name : "promise",
			value : Promise.resolve(1),
			then : 1
		},{
			name : "同步getThenable",
			value : getThenable(status,2),
			then : 2
		},{
			name : "异步getThenable",
			value : getThenable(status,3,true),
			then : 3
		},{
			name : "嵌套同步 getThenable",
			value : getThenableQT(status,4),
			then : 4
		},{
			name : "嵌套异步 getThenable",
			value : getThenableQT(status,5,true),
			then : 5
		}
	]
	baseValue.forEach(function(v,i){
		fun(v.name,v.value,v.then);
	})
}

module.exports = typeTest;