# extend-promise
基于promise扩展一些常用方法

```
var ep = require("extend-promise");
var P = ep(Promise);

P.defer() //return deferrer Object

//返回promise
P.delay(ms,value).then() 
P.resolve(obj)
P.reject(obj)
P.all(array)
P.allMap(array/map)
P.map(array,mapfun,options)
P.any(array)

QClass.nfcall(fun,...arg) //转换CPS函数
QClass.nfapply(fun,[arg]) //转换CPS函数

//返回function
QClass.denodeify(fun) //封装CPS函数

```
