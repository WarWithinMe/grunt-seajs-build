Project common:

应用场景：复杂的结构。

当前目录是一个大的项目，app/subdomain里面包含了一个子项目。
子项目依赖主项目的里面的文件。

这个Task定义了两个Target，一个是main，一个是subdomain。他们指向不同的文件夹。

当执行Target:main时，只对js目录进行处理，并把 js/src/widgets/*.js 和 js/src/utils/*.js 合并成两个单一文件。

当执行Target:subdomain时，只对app/subdomain/js进行处理。
app_main.js里面用到了 js/src/widgets/widgetA.js，这个文件被Target:main合并了。如果没有resolveID这个函数，
则app_main.js的define里面的依赖列表里面会包含widgetA.js。通过resolveID这个函数，把 ID : js/src/widgets/widgetA.js( 默认生成的ID是这个文件的路径 ) 转换成 js/src/widgets/widget.js。这样app_main.js就不在依赖widgetA.js这个文件，而是widget.js这个文件。
另外resolveID必须为那些它不关心的ID不返回任何东西。



