"use strict";

module.exports = function(grunt) {

  grunt.initConfig({
    jsdoc: {
      docs: {
        src: ['webgl/resources/webgl-utils.js'],
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
  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.registerTask('default', ['clean', 'jsdoc']);
};

