var path = require("path");
var gulp = require("gulp");
var gutil = require("gulp-util");
var browserify = require("gulp-browserify");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var header = require("gulp-header");

var package = require("./package.json");
var banner =
  '/*!\n' +
  ' * ' + package.name + ' v' + package.version + '\n' +
  ' * Homepage ' + package.homepage + '\n' +
  ' * License ' + package.license + '\n' +
  ' */\n'

gulp.task('build',['test'],function(){
	return gulp.src('./browser-source/*.js')
		.pipe(browserify())
		.pipe(header(banner))
		.pipe(gulp.dest('./dist'))
		.pipe(uglify())
		.pipe(header(banner))
		.pipe(rename({
			suffix:".min"
		}))
		.pipe(gulp.dest('./dist'));
})

gulp.task('test',function(){
	
});

gulp.task('default', ['build']);