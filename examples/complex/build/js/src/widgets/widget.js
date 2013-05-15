define('js/src/widgets/widgetA.js',[],function(require){

  console.log("Loaded Widget A");
  
});

define('js/src/widgets/widgetB.js',[],function(require){
  console.log("Loaded Widget B"); 
});

define('js/src/widgets/widgetC.js',[],function(require, exports, module){
  console.log("Loaded Widget C");
});

