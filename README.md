# grunt-seajs-build

> 构建Sea.js模块。包括：提取ID、依赖和合并文件。

## Getting Started
This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-seajs-build --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-seajs-build');
```

## The "seajs_build" task

### Overview
在项目的Gruntfile里面加入类似代码：


```js
grunt.initConfig({
  "seajs_build" : {
    options : {   // seajs_build的选项
        outputPath    : "build"
      , seajsBasePath : "js"

      , path      : "."
      , scheme    : null
      , alias     : null
      , resolveID : null
      , recursive : true
      , buildType : "exclude_merge"
    }
    , your_target : { 
        options : { path : "." }
      , files : [{ 
            src        : "js/main.js"
          , dest       : "js/main.js"
          , filter     : "isFile"
          , concatDeps : true
      }]
    }
  }
})
```


### Options

#### options.outputPath
类型   : `String`
默认值 : `"build"`

seajs_build的输出目录，相对于Gruntfile。

#### options.seajsBasePath
类型   : `String`
默认值 : `"."`

指向Sea.js的base路径，相对于Gruntfile。

#### options.path
类型   : `String`
默认值 : `"."`

指定要对哪个文件夹里面的文件进行处理。相对于`seajsBasePath`

#### options.scheme
类型   : `String, Function`
默认值 : `null`

当遇到require("XXX")时，如果在当前Task里面找到这个XXX文件，则利用scheme来生成这个文件的ID。  
如果未定义scheme，则ID是XXX文件的路径。  
如果scheme是字符串，则将会把scheme里面的`{{filename}}`替换成XXX文件的路径。  
scheme可以是一个函数 : `function(require){return id;}`，用于返回依赖的ID。


#### options.alias
类型   : `Function`
默认值 : `null`

和scheme类似，但只能是函数。当在当前Task里面找不到XXX文件的时候，会利用alias来生成这个文件的ID。  
如果未定义，则ID是XXX文件的路径。


#### options.resolveID
类型   : `Function`
默认值 : `null`

在提取ID、依赖，并改写define()的时候，需要将已经获取的"依赖ID列表"转成"依赖路径列表"。  
此时，可以利用resolveID : `function( id ){ return path; }` 来进行转换。  
__注意 :__ 在resolveID里面，如果id需要由task自己处理，应该返回`undefined`或者`null`。  
这个参数的使用场合可以参考`complex`例子


#### options.recursive
类型   : `Bool`
默认值 : `true`

如果为true, 提取ID、依赖的时候将会对`path`里面的子文件夹一并处理。

#### options.buildType
类型   : `String`
默认值 : `"exclude_merge"`
可选值 : `"all", "merge_only", "exclude_merge"`

生成方法。  
`all` : 提取ID、依赖，并把结果输出到`outputPath`。然后再将合并文件输出到`outputPath`  
`merge_only` : 提取ID、依赖，但只把合并文件输出到`outputPath`  
`exclude_merge` : 提取ID、依赖，输出合并文件。然后把所有没有合并的文件输出到`outputPath`  

#### target.files
类型   : `Grunt Files`

每一个target里面的files指定提取完ID、依赖之后，哪些文件需要合并在一起。

#### target.files.concatDeps
类型   : `Bool`
默认值 : `false`

Grunt files的额外参数。指定在合并的时候，是否把files的所有依赖都合并到目标文件里面。


## 使用场景
##### 请参考examples里面的例子 :  
`mindless` : 小型网站。所有JS合并成一个巨大的JS文件。  
`common`   : 常见的网站结构。  
`complex`  : 复杂的结构，大项目里面包含子项目。  

