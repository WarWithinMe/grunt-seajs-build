define('src/widgets/widgetA.js',[],function(require){

  console.log("Loaded Widget A");
  
});

define('src/widgets/widgetB.js',[],function(require){
  console.log("Loaded Widget B"); 
});

define('src/widgets/widgetC.js',[],function(require, exports, module){
  console.log("Loaded Widget C");
});

