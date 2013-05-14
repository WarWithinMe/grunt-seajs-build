define('src/widgets/widgetA.js',[],function(require){

  console.log("Loaded Widget A");
  
});

define('src/widgets/widgetB.js',[],function(require){
  console.log("Loaded Widget B"); 
});

define('src/widgets/widgetC.js',[],function(require, exports, module){
  console.log("Loaded Widget C");
});

define('src/widgets/widget.js',["src/widgets/widgetA.js","src/widgets/widgetB.js","src/widgets/widgetC.js"],function( require, exports, module ){

 require("src/widgets/widgetA.js"); 
 require("src/widgets/widgetB.js"); 
 require("src/widgets/widgetC.js"); 

});

define('src/utils.js',[],function(){
  console.log(" This is the utils ");
});

define('data/page_data.js',[],function(require, exports, module){

  exports = { data : "Mindless" };

});

define('main.js',["src/widgets/widget.js","src/utils.js","data/page_data.js"],function(require){

 require("src/widgets/widget.js");
 require("src/utils.js");
 require("data/page_data.js");
  
});

