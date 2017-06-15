"use strict";

var gulp=require('gulp'),
    bower=require('gulp-bower'),
    wiredep=require('wiredep').stream,
		foreach=require('gulp-foreach'),
    usemin=require('gulp-usemin'),
		htmlmin=require('gulp-htmlmin'),
		sourcemaps=require('gulp-sourcemaps'),
		uglify=require('gulp-uglify'),
		cleanCss=require('gulp-clean-css'),
		rev=require('gulp-rev'),
    connect=require('gulp-connect'),
    express=require('express'),
    php=require('node-php'),
    cors=require('cors'),
    opn=require('opn'),
    fs=require('fs'),
		path=require('path'),
		extend=require('extend'),
		Q=require('q'),
		clean=require('gulp-clean');

var app;
var config={
  documentRoot: './',
  host: 'localhost',
  port: 8080,
  home: 'index.html',
  bowerDir: './bower_components',
	dist: './dist',

}

function abort(err) {
	console.log(JSON.stringify(err,false,4));
	process.exit(1);
}

function getHtmlFiles() {
	return gulp.src('*.html');
}

// handle error events and synchronous chaining using promises
function wrap(taskName,stream,q) {
	stream=stream.on('error',function errorHandler(err){
	  console.log('ERROR: '+taskName+' failed !');
	  console.log(JSON.stringify(err,false,4));
		if (q) {
			q.reject(err);
		} else {
			process.exit(1);
		}
	}).on('end',function(){
		if (q)
			q.resolve(stream);
	});
	if (q) return q.promise;
	else return stream;
}

// download bower dependencies
gulp.task('bower', function(cb){
	 return bower()
    .pipe(gulp.dest(config.bowerDir));
});

// merge bower.json with file specific options
function getBowerJson(srcFile) {
	try {
		var srcFileJson=require(srcFile+'.json');
	} catch(e) {}
	var options=(srcFileJson && srcFileJson.bower)||{};
	var bowerJson=extend(true,{},require('./bower.json'),options);
	return bowerJson;
}

// inject bower dependencies
gulp.task('wiredep', function(cb){
	return getHtmlFiles()
	.pipe(foreach(function(stream,file){
		var filepath=path.join(file.cwd,file.relative);
		console.log('wiredep: '+filepath);
		return stream.pipe(
		  wrap('wiredep', wiredep({
		    verbose: true,
		    bowerJson: getBowerJson(filepath)
		  }))
		);
	}))
	.pipe(
		gulp.dest('.')
	);
});

// replace references to scripts and stylesheets in html files
// and store resulting files in directory "build"
gulp.task('usemin', function(cb){
		return getHtmlFiles()
		.pipe(foreach(function(stream,file){
			console.log('usemin: '+path.join(file.cwd,file.relative));
			return stream.pipe(usemin({
				css: [
//					sourcemaps.init({
//						loadMaps: true
//					}),
					wrap('cleanCss', cleanCss()),
//					'concat',
					rev(),
//					sourcemaps.write()
				],
				html: [
					function() {
						return wrap('htmlmin', htmlmin({
							collapseWhitespace:true
						}));
					}
				],
				js: [
					sourcemaps.init({
						loadMaps: true
					}),
					wrap('uglify js', uglify()),
					'concat',
					rev(),
					sourcemaps.write()
				],
				inlinejs: [
					wrap('uglify inlinejs', uglify())
				],
				inlinecss: [
					wrap('cleanCss', cleanCss()),
					'concat'
				]
			}));
		}))
		.pipe(gulp.dest('build/'))
});

gulp.task('cleanbuild', function(){
	return gulp.src('./build', {read: false})
	.pipe(clean())
});

// copy files to directory "dist"
gulp.task(
	'dist',
	function(cb) {
			var count=3;
			function goon(){
				if (--count==0) {
					cb(null);
				}
			}

			// copy assets
      wrap(
				'copy assets',
				gulp.src('./assets/**/*')
				.pipe(gulp.dest(config.dist)),
				Q.defer()
			)
			.catch(abort)
			.then(goon)
			.done();

			// copy files
			wrap(
				'copy files',
				gulp.src([
					'./build/**/*',
					'*.php'
				])
				.pipe(gulp.dest(config.dist)),
				Q.defer()
			)
			.catch(abort)
			.then(goon)
			.done();

      // copy images
			wrap(
				'copy images',
				gulp.src([
					'./js/**/*.png'
				]).pipe(gulp.dest(path.join(config.dist,'js'))),
				Q.defer()
			)
			.catch(abort)
			.then(goon)
			.done();
		}
);
// serve content through express and php-cgi
function php_cgi(connect,options) {
  app=express();
  app.use('/', php.cgi(config.documentRoot));
  return app;
}

gulp.task('server',function(cb){
  connect.server({
    root: config.documentRoot,
    host: config.host,
    port: config.port,
    middleware: function(connect,opt){
      return [
        cors(),
        php_cgi()
      ];
    },
    livereload: true
  });
	cb(null);
});

// watch for changes
gulp.task('watch', function(cb){

  // trigger reloading html pages when specified files change
  gulp.watch(
    [
      '**.html',
      '**.php',
      '**.css',
      '**.js',
      '**.kml',
      '**.x3d',
			'!build/**/*',
			'!gulpfile.js'
    ],
    gulp.series('html')
  );

  // trigger package injection/removal on bower.json change
  gulp.watch('bower.json', gulp.series('inject'));

	cb(null);
	
});

// open browser
gulp.task('open', function(cb){
  opn('http://'+config.host+':'+config.port+'/'+config.home);
	cb(null);
});

gulp.task('connect', gulp.series('server','watch','open'));

// reload html pages on change
gulp.task('html', function(){
  return getHtmlFiles()
  .pipe(connect.reload());
});

// inject bower dependencies
gulp.task('inject', gulp.series('bower','wiredep'));

// inject bower dependencies and generate directory 'build' content with usemin
gulp.task('build', gulp.series('bower','wiredep','usemin'));

gulp.task('prod-root', function(cb){
	config.documentRoot=config.dist;
	cb(null);
});

// start server with frorm "build" directory
gulp.task('prod', gulp.series('prod-root','build','dist','connect'));

gulp.task(
  'default',
	gulp.series('inject','connect')
);
