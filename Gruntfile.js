'use strict';

const fs = require('fs');
const path = require('path');
const liveEditor = require('@gfxfundamentals/live-editor');
const liveEditorPath = path.dirname(require.resolve('@gfxfundamentals/live-editor'));

console.log(liveEditor.monacoEditor);
console.log(liveEditorPath);

module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  const s_ignoreRE = /\.(md|py|sh|enc)$/i;
  function noMds(filename) {
    return !s_ignoreRE.test(filename);
  }

  const s_isMdRE = /\.md$/i;
  function mdsOnly(filename) {
    return s_isMdRE.test(filename);
  }

  function notFolder(filename) {
    return !fs.statSync(filename).isDirectory();
  }

  function noMdsNoFolders(filename) {
    return noMds(filename) && notFolder(filename);
  }

  grunt.initConfig({
    eslint: {
      lib: {
        src: [
          'webgl/resources/webgl-utils.js',
          'webgl/resources/lessons-helper.js',
          'webgl/resources/primitives.js',
          'webgl/resources/2d-math.js',
          'webgl/resources/3d-math.js',
        ],
      },
      examples: {
        src: [
          'webgl/*.html',
        ],
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
          destination: 'out/docs',
          configure: 'build/conf/jsdoc.conf.json',
          template: './node_modules/minami',
        },
      },
    },
    copy: {
      main: {
        files: [
          { expand: false, src: '*', dest: 'out/', filter: noMdsNoFolders, },
          { expand: true, cwd: `${liveEditor.monacoEditor}/`, src: 'min/**', dest: 'out/monaco-editor/', nonull: true, },
          { expand: true, cwd: `${liveEditorPath}/src/`, src: '**', dest: 'out/webgl/resources/', nonull: true, },
          { expand: true, src: 'webgl/**', dest: 'out/', filter: noMds, },
          { expand: true, src: '3rdparty/**', dest: 'out/', },
        ],
      },
    },
    clean: [
      'out/**/*',
    ],
    buildlesson: {
      main: {
        files: [],
      },
    },
    watch: {
      main: {
        files: [
          'webgl/**',
          '3rdparty/**',
        ],
        tasks: ['copy'],
        options: {
          spawn: false,
        },
      },
      lessons: {
        files: [
          'webgl/lessons/**/webgl*.md',
        ],
        tasks: ['buildlesson'],
        options: {
          spawn: false,
        },
      },
    },
  });

  let changedFiles = {};
  const onChange = grunt.util._.debounce(function() {
    grunt.config('copy.main.files', Object.keys(changedFiles).filter(noMds).map((file) => {
      return {
        src: file,
        dest: 'out/',
      };
    }));
    grunt.config('buildlesson.main.files', Object.keys(changedFiles).filter(mdsOnly).map((file) => {
      return {
        src: file,
      };
    }));
    changedFiles = {};
  }, 200);
  grunt.event.on('watch', function(action, filepath) {
    changedFiles[filepath] = action;
    onChange();
  });

  const buildSettings = {
    outDir: 'out',
    baseUrl: 'http://webglfundamentals.org',
    rootFolder: 'webgl',
    lessonGrep: 'webgl*.md',
    siteName: 'WebGLFundamentals',
    siteThumbnail: 'webglfundamentals.jpg',  // in rootFolder/lessons/resources
    templatePath: 'build/templates',
  };

  // just the hackiest way to get this working.
  grunt.registerMultiTask('buildlesson', 'build a lesson', function() {
    const filenames = new Set();
    this.files.forEach((files) => {
      files.src.forEach((filename) => {
        filenames.add(filename);
      });
    });
    const buildStuff = require('@gfxfundamentals/lesson-builder');
    const settings = Object.assign({}, buildSettings, {
      filenames,
    });
    const finish = this.async();
    buildStuff(settings).finally(finish);
  });

  grunt.registerTask('buildlessons', function() {
    var buildStuff = require('@gfxfundamentals/lesson-builder');
    var finish = this.async();
    buildStuff(buildSettings).finally(finish);
  });

  grunt.registerTask('build', ['clean', 'copy', 'buildlessons']);
  grunt.registerTask('buildwatch', ['build', 'watch']);

  grunt.registerTask('default', ['eslint', 'build', 'jsdoc']);
};

