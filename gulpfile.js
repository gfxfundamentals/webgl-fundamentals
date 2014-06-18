var gulp = require('gulp');
var jsdoc = require("gulp-jsdoc");

gulp.task('docs', function() {
  return gulp.src("./webgl/resources/webgl-utils.js")
    .pipe(jsdoc('./docs'))
});

gulp.task('default', function() {
  // place code for your default task here
});

