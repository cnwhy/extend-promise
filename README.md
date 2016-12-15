# extend-promise
基于promise扩展一些常用方法

##类扩展
```
var ep = require("extend-promise");
var P = ep.extendClass(Promise,{});
//ep.extendClass(Promise) 不传第二个参数则扩展到Promise上.

defer P.defer() //return deferrer Object 
//defer.promise //Pormise对像
//defer.resolve(value) //解决
//defer.reject(err)  //拒绝

//返回promise
P.resolve(value) 
P.reject(obj)       
P.all(PromiseArray)
P.allMap(PromiseArray/map)
P.map(array,mapfun,options) //遍历执行, options.concurrency 可配置并发,
P.any(PromiseArray) //返回最先改变状态的Promise状态
P.delay(time,value) //延迟指定时间 
P.some(PromiseArray,count) //获取最快解决Promise值;

//CPS函数相关
P.nfcall(fun,...arg) //转换CPS函数
P.nfapply(fun,[arg]) //转换CPS函数

//返回function
var newfn = P.denodeify(fun) //封装CPS函数

```

Promise原型扩展:
```
var ep = require("extend-promise");
var Promise = require("easy-promise"); //建议扩展原生Promise,可以扩展第三方Promise实现
ep.extendPrototype(Promise);

//返回promise
promise = Promise.resolve(1);


//promise 扩展后如下
.then({resolveFun},{rejectFun}) 
.catch({rejectFun}) 
.catchOf({errType},{rejectFun}) //与catch不同的是 reject理由如果与errType相等/ instanceof 为 true时 才交由`rejectFun`处理,否则继续传递.
.error({rejectFun}) //为.catchOf(Error,{rejectFun})的语法糖
.finali({function}) 
.done({resolveFun},{rejectFun}) //同then,但不再返回promise,未解决的错会值接抛出

```
