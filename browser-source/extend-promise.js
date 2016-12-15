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