/*
 * grunt-seajs-build
 * 
 *
 * Copyright (c) 2013 WarWithinMe
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({

    // Configuration to be run (and then tested).
    seajs_build: {
        options : { 
          outputPath    : "build"
        , seajsBasePath : "js" // a path that points to the same location as `Sea.js's base`
                               // relative to GruntFile.js

        // Following options' value is their default value
        , path       : "."
                // a folder that is relative to `seajsBasePath`, files within the folder will be added ID.
        , scheme     : null
                // `scheme` type:
                //   String, {{filename}} is replace by the file path, relative to `seajsBasePath`.
                //   Function : function( FILENAME ) { return ID; }
                //   Falsy, the ID is FILENAME.
        , alias      : null
                // Use `alias` to map PATH (relative to `seajsBasePath`) to ID, if :
                // 1. The dependency is not found within the TARGET's path.
                // 2. The dependency's path is not relative path.
                // Otherwise, use `scheme` to determine the ID
        , resolveID  : null
                // When adding dependency array to `define()`, the task has to change ID to file PATH.
                // If resolveID is a function(id){}, it is called during translate ID to PATH.
                // 
                // !!!!! Important, resolveID must return FALSY(null,undefined,false) or return nothing to
                // indicate that the ID should be handled by the task.
                // 
        , recursive  : true
                // If true, add ID for files in subfolder.
        , buildType  : "exclude_merge"
                // Possible values :
                // "all"
                //   Build and output all files in TARGET, then output the merged file.
                // "merge_only"
                //   Only merged file ( specified in `TARGET's files` ) will be created in `outputPath`
                // "exclude_merge"
                //   Output the merged file. Then output those not merged files.
      }

      // Target `main`
      // A build_cmd TARGET does :
      // 1. use `scheme` and `alias` to add ID for each CMD module file within `path`
      // 2. concat CMD into one file.
      , main : { 
          options : { path : "." }

        // `files` is used to determine what files should be merge to one file.
        // See https://github.com/gruntjs/grunt/wiki/Configuring-tasks#files
        // Parameters : 
        //   `src`  is relative to GruntFile
        //   `dest` is relative to options.outputPath
        //   `concatDeps` ( default:false ): If true, include all dependencies into one file, recursively.
        , files : [
            { 
              src        : "js/main.js"
            , dest       : "js/main.js"
            , filter     : "isFile"
            , concatDeps : true
          }
        ]
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js'],
    },

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('default', ['seajs_build', 'nodeunit']);

};
