module.exports = function(Promise){
	require("../src/extendClass")(Promise),
	require("../src/extendPrototype")(Promise)
	return(Promise)
}