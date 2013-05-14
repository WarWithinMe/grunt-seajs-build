define('../js/src/utils/util1.js',[],function(require){

  console.log("Loaded Util1");
  
});

define('../js/src/utils/util3.js',[],function(require, exports, module){
  console.log("Loaded Util3");
});

define('../js/src/utils/util2.js',["../js/src/utils/utils.js"],function(require){
 require("../js/src/utils/util3.js");
  console.log("Loaded Util2"); 
});

