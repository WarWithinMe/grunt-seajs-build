/*
 * grunt-seajs-build
 * 
 *
 * Copyright (c) 2013 WarWithinMe
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
  
  /* Building for Sea.js
     // Phase Trasform
     1. each TARGET defines a SCHEME of 
          how to transform file PATH to ID
          within a FOLDER
     2. each FILE within the FOLDER is a CMD
     3. for each CMD, change `define(FACTORY)` to `define(ID, DEPENDENCIES, FACTORY)`
     4. for each require/use call, change `require(xxx)` to `require(ID)`

     // Phase Concat
     1. specify an ALGORITHM to determine what files should be concat together
     2. output a seajs.config.alias object to indicate ID to PATH mapping.
   */

  /* Notes about SCHEME.
     the SCHEME is only applied if the DEPENDENCY is found within TARGET.
     otherwise, the PATH to ID is by a ALIAS FUNCTION.
   */

  /* Notes about CONCAT
     the dependencies must comes first.
   */

  var RE_HAS_DEFINE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*define|(?:^|[^$])\b(def)(ine)\s*\(/g;
    /**/
  var RE_DEFINE_DEPS = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*define|(?:^|[^$])\bdefine\s*\(\s*(["']).+?\1\s*(["'])/g;
    /*'*/
  var RE_REQUIRE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*require|(?:^|[^$])\brequire\s*\(\s*(["'])(.+?)\1\s*\)/g;
    /*"*/
  var RE_DEFINE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*define|(?:^|[^$])\b(define)\s*\(\s*({|function)/g;


  var path  = require("path");
  var gFile = grunt.file;


  grunt.registerMultiTask("seajs_build", function () {
    grunt.log.ok( "Trasforming for target : " + this.target );

    var projectData = {
        content    : {}
      , dependency : {} // File's Dependency, abspath to ids
      , dep_expand : {} // like dependency, abspath to ids
      , dep_merge  : {} // abspath to abspath
      , requireMap : {}
      , scanArray  : []
      , notCMD     : {}
      , id2File    : {}
      , file2Id    : {}
    };
    var options     = this.options({
          path       : "."
        , scheme     : null
        , alias      : null 
        , recursive  : true
        , concatDeps : false
        , buildType  : "exclude_merge"
    });
    var buildType = 0;
    switch( options.buildType ) {
      case "all" :        buildType = 0; break;
      case "merge_only" : buildType = 1; break;
      default :           buildType = 2;
    }


    /// MultiTask Setup Code ///
    options.outputPath    = ensureTrailingSlash( options.outputPath );
    options.seajsBasePath = ensureTrailingSlash( options.seajsBasePath );

      // Make the TARGET's PATH relative to GruntFile
    if ( options.path == "." ) {
      options.path = options.seajsBasePath;
    } else {
      options.path = ensureTrailingSlash( options.seajsBasePath + options.path );
    }

    if ( !gFile.exists( options.outputPath ) ) { gFile.mkdir( options.outputPath ); }
    ///////////////////////////


    if ( !gFile.isPathInCwd( options.seajsBasePath) && !gFile.isPathCwd( options.seajsBasePath ) ) {
      grunt.fail.fatal("Seajs Base Path Not Found!");
    }


    /*
        Get project files list and add Dependecy-Scanning Tasks
     */
    gFile.recurse( options.path, function(abspath, rootdir, subdir, filename) {
      // Do nothing if it's not js file
      if ( filename.indexOf(".js") != filename.length - 3 || filename.length <= 3 ) { return; }
      // Do nothing if file is in subfolder and TARGET is not recursive.
      if ( options.recursive === false && subdir ) { return; }

      subdir = ensureTrailingSlash( subdir );
      var content = gFile.read(abspath).toString();

      projectData.scanArray.push(abspath);
      projectData.content[abspath] = content;

      scan( options, projectData, content, abspath );
    });


    /*
      Substitute Dependency with merge file.
     */
    this.files.forEach(function( file ){
      file.src.forEach(function( value ){
        projectData.dep_merge[ value ] = file.dest;
      });
    });


    /*
       Substitute content
       Add ID.
       Add Dependency.
     */
    projectData.scanArray.forEach( function( abspath ) {
      projectData.content[abspath] = transform( options, projectData, projectData.content[abspath], abspath);

      // Write all files
      if ( buildType == 0 ) {
        gFile.write( options.outputPath + abspath, projectData.content[abspath] );
      }
      
    });


    /*
        Concat CMD Files
        The dependency comes first.
     */
    var mergedFiles = {};
    this.files.forEach(function( file ) {
      var c = concat( file, projectData, file.concatDeps );
      gFile.write( options.outputPath + file.dest, c.content );

      if ( buildType == 2 ) {
        c.list.forEach( function( v ){ mergedFiles[v] = true; });
      }
    });


    /*
        Build other non-merged files.
     */
    if ( buildType == 2 ) {
      projectData.scanArray.forEach(function( abspath ){
        if ( mergedFiles.hasOwnProperty(abspath) ) { return; }
        gFile.write( options.outputPath + abspath, projectData.content[abspath] );
      });
    }
  });



  ////////////////////
  //// Helpers
  ////////////////////
  function dereplicate( array ) {
    var a = {};
    var b = [];
    for ( var i = 0, len = array.length; i < len; ++i ) {
      if ( a[ array[i] ] !== true ) {
        a[ array[i] ] = true;
        b.push( array[i] );
      }
    }
    return b;
  }
  function ensureTrailingSlash ( p ) {
    if ( !p || p.length == 0 ) { return ""; }
    p = path.normalize( p );
    switch ( p[p.length-1] ) {
      case "\\":
      case "/" :
        return p;
      default  :
        return p + "/";
    }
  }

  function colorLog ( text, color ) {
    var reset = "\x1B[0m"
    switch ( color ) {
      case "black"   : return '\x1B[30m' + text + reset;
      case "red"     : return '\x1B[31m' + text + reset;
      case "green"   : return '\x1B[32m' + text + reset;
      case "yellow"  : return '\x1B[33m' + text + reset;
      case "blue"    : return '\x1B[34m' + text + reset;
      case "magenta" : return '\x1B[35m' + text + reset;
      case "cyan"    : return '\x1B[36m' + text + reset;
      case "white"   : return '\x1B[37m' + text + reset;
      default        : return text;
    }
  }

  function resolveToBase ( abspath, base ) {
    // The input  `abspath` is relative to GruntFile
    // The output `path` is relative to base and normalized
    var abspaths = path.normalize( abspath ).split("/");
    var bases    = base.split("/");
    var newPaths = [];

    for ( var i = 0, j = 0; i < bases.length; ++i ) {
      if ( !bases[i] ) { break; }

      if ( bases[i] == abspaths[j] ) {
        ++j;
      } else {
        newPaths.push("..");
      }
    }

    if ( j > 0 ) { abspaths.splice(0, j); }
    abspaths = abspaths.join("/");

    return newPaths.length ? newPaths.join("/") + "/" + abspaths : abspaths;
  }

  function path2id( p, scheme ) {
    if ( scheme ) {
      return typeof scheme == "string" ?
                scheme.replace("{{filename}}", p) : scheme(p);
    } else {
      return p;
    }
  }

  var injectA = "var window={}, require=function(){};\n"
  + "var define = (function(){\n"
    + "var deps = null, d = function(i,d,f){\n"
      + "if ( deps == null ) { deps = []; }\n"
      + "if ( f ) { deps.push({ id:i, deps:d }) }\n"
      + "if ( d ) { deps.push({ id:i }) } }\n"
      + "d.__t_de1_ = function(n) { if(n===false) deps=null; return deps; }; \n"
      + "return d; })(); \n"
  + "try{\n\n";
  var injectB = "\n}catch(e){ define.__t_de1_(false); }\n;\ndefine.__t_de1_();";

  function scan( options, projectData, content, abspath ) {
    "use strict";

    var define_heads = [];

    var requireMap = projectData.requireMap[abspath] = {};

    // Test if the file is CMD module, and user-defined ID and Depenecies
    var hasDefine = false;
    content.replace( RE_HAS_DEFINE, function(m, m1, m2){ if(m2) { hasDefine = true; } return m; });
    // This `Regex Checking` is not perfect.
    // e.g. sea-debug.js is not a CMD, but it pass the checking.
    if ( !hasDefine ) {
      grunt.log.writeln(colorLog("   - ", "yellow") + "Ignoring none cmd : " + abspath );
      projectData.notCMD[abspath] = true;
      return;
    }

    // Use eval to quickly extract possible user defined id and deps.
    // If user defines ID and deps. Assume the user knows what
    // they're doing, thus the ID and deps is not modified.
    var predefines  = eval( injectA + content + injectB );
    var predefineID = null;
    if ( predefines == null ) {
      // This is 100% not a valid Sea.js module.
      grunt.log.writeln(colorLog("   - ", "yellow") + "Ignoring none cmd : " + abspath );
      projectData.notCMD[abspath] = true;
      return;
    } else if ( predefines.length ) {
      grunt.log.writeln(colorLog("   - ", "yellow") + "Found user-defined ID and Deps : " + abspath );

      // If the file already has predefines. Use them, instead of generating.
      var all_deps = [];
      var predefine_dep = false;
      predefines.forEach( function( val ){
        predefineID = val.id;
        projectData.id2File[ val.id  ] = abspath;
        projectData.file2Id[ abspath ] = val.id;

        if ( Array.isArray(val.deps) ) {
          predefine_dep = true;
          all_deps = all_deps.concat( val.deps );
        } else if ( val.deps ) {
          predefine_dep = true;
          all_deps.push( val.deps );
        }
      });

      if ( predefine_dep ) {
        projectData.dependency[abspath] = all_deps;
        return;
      }

      // User did not define dependency. We need to extract them.
    }

    // This is a well-formed Sea.js Module. i.e. No id and No deps.
    // Create dependency array
    var requires = [];
    content = content.replace( RE_REQUIRE, function( m, m1, m2, offset, string ){

      if ( m2 ) {
        // Found a require("XXX"), which XXX is m2;

        // The require uri can be :
        // relative : starts with . or ..
        //    It's relative to current module
        // normal   : starts with / or http://, https:// ...
        //    It's not relative to anything
        // absolute : everything else
        //    It's relative to seajsBasePath

        // The SCHEME is used to transform files within this TARGET
        // The ALIAS  is used to transform files within this PROJECT

        var replace = null;

        if ( /^\w{2,6}:\/\//.exec( m2 ) ) {
          // Do nothing if the uri is like http://, https://
          requires.push( m2 );
          return m;
        }

        if ( m2.length < 4 || m2.indexOf(".js") != m2.length - 3 ) { m2 += ".js"; }

        if ( m2[0] == "/" ) {
          // Use ALIAS to get ID for `normal` uri
          if ( options.alias ) {
            replace = options.alias( m2 );
          }
        } else {
          var absM2;
          var useScheme = true;

          if ( m2[0] == "." ) {
            absM2 = path.normalize( abspath + "/../" + m2 );
          } else {
            absM2 = path.normalize( options.path + m2 );
          }

          // Use SCHEME to get the ID of the file if only :
          // 1. The file exists and is inside TARGET's PATH
          // 2. The file is in subfolder and TARGET is `recursive`
          //    Or
          //    The file is not in subfolder

          if ( !gFile.exists( absM2 ) ) {
            useScheme = false;
          } else if ( absM2.indexOf( options.path ) != 0 ) {
            useScheme = false;
          } else if ( options.recursive === false ) {
            if ( absM2.replace( options.path ).indexOf("/") != -1 ) {
              useScheme = false;
            }
          }

          // Make m2 to be relative to seajsBasePath
          absM2 = resolveToBase( absM2, options.seajsBasePath );

          if ( useScheme ) {
            replace = path2id( absM2, options.scheme );
          } else {
            replace = options.alias ? options.alias( absM2 ) : null;
          }
        }

        // If we have a modified ID, use it, otherwise, use XXX from require(XXX).
        if ( replace ) { 
          requireMap[ m2 ] = replace;
          requires.push( replace );
        } else {
          requires.push( m2 );
        }
      }

      return m;
    });
    
    var thisFile = resolveToBase( abspath, options.seajsBasePath );
    var thisID   = predefineID ? predefineID : path2id( thisFile, options.scheme );

    projectData.id2File[ thisID  ]  = abspath;
    projectData.file2Id[ abspath ]  = thisID;
    projectData.dependency[abspath] = requires;
  }

  // Note : transform() does not support define("string") syntax.
  function transform(options, projectData, content, abspath) {

    if ( projectData.notCMD[abspath] ) {
      return content;
    }
    
    // Substitute require(XXX) to require(ID)
    var requireMap = projectData.requireMap[ abspath ];
    content = content.replace( RE_REQUIRE, function( m, m1, m2, offset, string ){

      if ( m2 && requireMap.hasOwnProperty( m2 ) ) {
        return 'require("' + requireMap[m2] + '")';
      } else {
        return m;
      }
    });

    // Change define(FACTORY) to define(ID,DEPENDENCIES,FACTORY)
    var newID      = projectData.file2Id[ abspath ];
    var new_define = "define('" 
                        + newID + "',"
                        + JSON.stringify( getMergedDependency(projectData, abspath, options.seajsBasePath) )
                        + ",";

    grunt.log.writeln( colorLog("   - ", 'blue') 
                        + "File : [" + abspath + "]" 
                        + colorLog(" >>>> ", 'blue') 
                        + "ID : \"" + newID + "\"" );
    
    content = content.replace( RE_DEFINE, function(m, m1, m2){ return m2 ? new_define + m2 : m; });

    // Write new content
    return content;
  }

  // The dependency array contains file path ( relative to seajs's base )
  function getMergedDependency( projectData, abspath, seajsBasePath ) {
    var calc_deps = [];
    var fileDeps = projectData.dependency[abspath];
    if ( !fileDeps ) { return calc_deps; }

    fileDeps.forEach(function( a_dep_id ){

      var dep_abs_path = projectData.id2File[ a_dep_id ];
      if ( projectData.dep_merge.hasOwnProperty(dep_abs_path) ) {
        dep_abs_path = projectData.dep_merge[ dep_abs_path ];
      }

      if ( dep_abs_path ) {
        dep_abs_path = resolveToBase( dep_abs_path, seajsBasePath );
      }

      calc_deps.push( dep_abs_path ? dep_abs_path : a_dep_id );
    });

    return dereplicate( calc_deps );
  }

  function concat( file, projectData, concatDeps ) {

    var files = [].concat(file.src);
    var reverse_dep_map = {};
    var visited = {};
    var vertex  = files;

    // Finds out which file can be the entry point.
    var BFS = function ( value, index, array ) {
      if ( visited.hasOwnProperty(value) ) { return; }
      visited[value] = true;

      var deps = projectData.dependency[ value ];
      if ( !deps ) { return; }

      for ( var i = 0; i < deps.length; ++i ) {
        var depAbsPath = projectData.id2File[ deps[i] ];

        if ( !depAbsPath ) {
          grunt.fail.fatal("Can't find file when merging, the file might exist but it's not a Sea.js module : [ " + deps[i] + " ]" );
        }

        this.push( depAbsPath );
        reverse_dep_map[ depAbsPath ] = true;
      }
    }

    while ( vertex.length ) {
      var new_vertex = [];
      vertex.forEach(BFS, new_vertex);
      vertex = new_vertex;
    }

    var entryFiles = files
                      .filter(function(v){ return !reverse_dep_map.hasOwnProperty(v); }, reverse_dep_map)
                      .map(function(v){ return projectData.file2Id[v]; });
    if ( files.length == 0 ) {
      grunt.fail.fatal("Circular dependency found when merging to : " + file.dest );
      return;
    }

    // Topological sort
    visited = {};
    var TOPO = function ( value, index, array ) {
      if ( visited.hasOwnProperty( value ) ) { return; }
      visited[value] = true;

      var abspath = this.projectData.id2File[value];
      var deps    = this.projectData.dependency[ abspath ];
      if ( deps ) { deps.forEach( TOPO, this ); }

      this.push( abspath );
    }
    var sortResult = [];
    sortResult.projectData = projectData;
    entryFiles.forEach( TOPO, sortResult );
    delete sortResult.projectData;


    if ( !concatDeps ) {
      sortResult = sortResult.filter(function(v){ return files.indexOf(v) != -1; });
    }

    // Merge
    var c = sortResult.reduce(function(pv, cv){ return pv + projectData.content[cv] + "\n"; }, "");

    return { content : c, list : sortResult };
  }
};
