'use strict';

var gulp = require('gulp');
var del = require('del');

var runSequence = require('run-sequence');

// Load plugins
var $ = require('gulp-load-plugins')();
var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream'),

    sourceFile = './app/scripts/app.js',

    destFolder = './dist/scripts',
    destFileName = 'app.js';

var browserSync = require('browser-sync');
var reload = browserSync.reload;



// Default task
gulp.task('default', ['clean', 'watch']);


// Clean
gulp.task('clean', function(cb) {
    $.cache.clearAll();
    cb(del.sync(['dist']));
});

// Styles
gulp.task('styles', function(){
  gulp.src(['./app/styles/**/*.css'], { base: './app/styles/' })
  .pipe(gulp.dest('dist/styles'));
});


// browserify
var bundler = watchify(browserify({
    entries: [sourceFile],
    debug: true,
    insertGlobals: true,
    cache: {},
    packageCache: {},
    fullPaths: false
}));
bundler.on('update', rebundle);
bundler.on('log', $.util.log);
function rebundle() {
    return bundler.bundle()
        // log errors if they happen
        .on('error', $.util.log.bind($.util, 'Browserify Error'))
        .pipe(source(destFileName))
        .pipe(gulp.dest(destFolder))
        .on('end', function() {
            reload();
        });
}
gulp.task('scripts', rebundle);

gulp.task('html', function() {
    return gulp.src('app/*.html')
        .pipe(gulp.dest('dist'))
});

gulp.task('buildBundle', ['styles', 'buildScripts', 'moveLibraries' /*, 'bower'*/], function() {
    return gulp.src('./app/*.html')
        .pipe($.useref.assets())
        .pipe($.useref.restore())
        .pipe($.useref())
        .pipe(gulp.dest('dist'));
});

// Watch
gulp.task('watch', ['html', 'scripts'], function() {
    browserSync({
        notify: false,
        logPrefix: 'BS',
        server: ['dist']
    });
    gulp.watch('app/*.html', ['html-reload']);
    gulp.watch(['app/styles/**/*.scss', 'app/styles/**/*.css'], ['css-reload']);
});

let bsReload = done => {
    browserSync.reload();
    done();
};
gulp.task('html-reload', ['html'], bsReload);
gulp.task('css-reload', ['styles', 'scripts'], bsReload);



// Build production site.
gulp.task('uglify-js', function() {
  return gulp.src('dist/scripts/app.js')
    .pipe($.uglify())
    .pipe(gulp.dest('dist/scripts'))
});

gulp.task('inlinesource', function () {
    return gulp.src('./dist/index.html')
        .pipe($.inlineSource())
        .pipe(gulp.dest('./dist/'));
});

gulp.task('production', function(cb) {
  process.env.NODE_ENV = 'production';
  runSequence(
    'clean',
    ['html', 'styles', 'scripts'],
    'uglify-js',
    'inlinesource'
    , function() {
      process.exit()
    })
});
