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
          configure: 'build/conf/jsdoc.conf.json',
          template: 'build/jsdoc-template/template',
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
    var finish = this.async();
    buildStuff().then(function() {
        finish();
    }).done();
  });

  grunt.registerTask('default', ['eslint', 'build', 'clean', 'jsdoc']);
};

