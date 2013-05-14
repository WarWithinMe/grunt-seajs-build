define('src/utils/util1.js',[],function(require){

  console.log("Loaded Util1");
  
});

define('src/utils/util3.js',[],function(require, exports, module){
  console.log("Loaded Util3");
});

define('src/utils/util2.js',["src/utils/utils.js"],function(require){
 require("src/utils/util3.js");
  console.log("Loaded Util2"); 
});

