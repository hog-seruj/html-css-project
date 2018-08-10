'use strict';

var autoprefixer     = require('gulp-autoprefixer');
var browserSync      = require('browser-sync').create();
var concat           = require('gulp-concat');
var cssmin           = require('gulp-cssmin');
var fs               = require('fs');
var glob             = require('glob');
var gulp             = require('gulp');
var gulpif           = require("gulp-if");
var importOnce       = require('node-sass-import-once');
var jsmin            = require('gulp-jsmin');
var notify           = require("gulp-notify");
var path             = require('path');
var plumber          = require('gulp-plumber');
var prefix           = require('gulp-autoprefixer');
var prompt           = require('prompt');
var rename           = require('gulp-rename');
var sass             = require('gulp-sass');
var sassGlob         = require('gulp-sass-glob');
var sassLint         = require('gulp-sass-lint');
var sequence         = require('run-sequence');
var sourcemaps       = require('gulp-sourcemaps');
var spritesmith      = require('gulp.spritesmith');
var stripCssComments = require('gulp-strip-css-comments');
var watch            = require('gulp-watch');

var sassLintConf     = require('./sass-lint');
var config           = require('./config');
var rootPath         = __dirname + '/';
var componentsPath   = __dirname + '/components/';
var nodePath         = __dirname + '/node_modules/';

var $sprites = [
  './images/icons/*.png'
];
var $fonts = ['./fonts/'];
var $css = [
  './css/style.css'
];

var $js = [
  './components/**/*.js'
];

var sassOptions = {
  importer: importOnce,
  includePaths: [
    componentsPath,
    nodePath,
    nodePath + '/chroma-sass/sass/',
    nodePath + '/typey/stylesheets/'
  ],
  style: 'expanded',
  outputStyle: 'nested',
  sourceMap: 'sass',
  sourceComments: 'map'
};

/* Local setup */
gulp.task('config', function (cb) {
  prompt.get('target', function (err, result) {
    if (err) console.log(err);
    else {
      fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(result));
    }
    cb();
  });
});

/* Sprites */
gulp.task('sprite', function () {
  return  gulp.src($sprites)
    .pipe(spritesmith({
      imgName: 'sprite.png',
      cssName: '_sprite.scss',
      padding: 1
    }))
    .pipe(gulpif('*.png', gulp.dest('./css/')))
    .pipe(gulpif('*.scss', gulp.dest('./sass/mixins/')));
});

/* Fonts */
gulp.task('fonts', function () {
  return  gulp.src($fonts)
    .pipe(gulp.dest('./fonts'));
});

/* CSS concat*/
gulp.task('css_concat', ['sass', 'sass_lint'], function () {
  gulp.src($css)
    .pipe(concat('style.css'))
    .pipe(gulp.dest('./css'))
    .pipe(cssmin({path: './css/style.css'}))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('./css'));
});

/* JS concat */
gulp.task('js_concat', function () {
  gulp.src($js)
    .pipe(sourcemaps.init())
    .pipe(concat('main.js'))
    .pipe(gulp.dest('./js'))
    .pipe(jsmin({path: './js/main.min.js'}))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('./js'));
});

/* Linter */
gulp.task('sass_lint', function () {
  return gulp.src('./components/**/*.scss')
    .pipe(sassLint({
      options: sassLintConf.options,
      files: sassLintConf.files,
      rules: sassLintConf.rules,
      configFile: 'sass-lint.yml'
    }))
    .pipe(sassLint.format())
    .pipe(sassLint.failOnError());
});

/* Main SASS task */
gulp.task('sass', function () {
  return gulp.src(['./components/**/*.s*ss'])
    .pipe(sourcemaps.init())
    .pipe(sassGlob())
    .pipe(stripCssComments())
    .pipe(sass(sassOptions).on('error', sass.logError))
    .pipe(sass.sync())
    .pipe(autoprefixer({
      browsers: ['last 5 versions'],
      cascade: false
    }))
    .pipe(gulp.dest('./css'));
    // .pipe(browserSync.stream());
});

/* Watch */
gulp.task('watch', ['css_concat', 'sprite', 'fonts'], function() {
  browserSync.init({
    proxy: {
      target: config.target
    }
  });

 watch(['./images/icons/'], function(event, cb) {
   gulp.start('sprite');
 });

 watch(['./components/**/*.scss'], function(event, cb) {
   gulp.start('css_concat');
 });

 gulp.watch('./css/style.css').on('change', browserSync.reload);

  watch(['./js/*.js'], function(event, cb) {
   gulp.start('js_concat');
  }).on('change', browserSync.reload);
});

/* Default task */
gulp.task('default', ['watch']);

/* Gulp compile */
gulp.task('compile', ['css_concat', 'js_concat', 'sprite', 'fonts']);

