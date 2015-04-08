"use strict";

module.exports = function(grunt) {

  grunt.initConfig({
    eslint: {
      target: [
        'webgl/resources/webgl-utils.js',
        'webgl/resources/primitives.js',
        'webgl/resources/webgl-2d-math.js',
        'webgl/resources/webgl-3d-math.js',
      ],
      options: {
        config: 'build/conf/eslint.json',
        //rulesdir: ['build/rules'],
      },
    },
    jsdoc: {
      docs: {
        src: [
          'webgl/resources/primitives.js',
          'webgl/resources/webgl-2d-math.js',
          'webgl/resources/webgl-3d-math.js',
          'webgl/resources/webgl-utils.js',
          'docs.md',
        ],
        options: {
          destination: 'docs',
          configure: 'jsdoc.conf.json',
          template: 'node_modules/ink-docstrap/template',
        },
      },
    },
    clean: [
        'docs',
    ],
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.registerTask('build', function() {
    var buildStuff = require('./build/js/build');
    buildStuff();
  });

  grunt.registerTask('default', ['clean', 'jsdoc']);
};

