'use strict';

const fs 				= require('fs')
const path 				= require('path');
const del 				= require('del');
const gulp 				= require('gulp');
const sourcemaps 		= require('gulp-sourcemaps');
const browserSync 		= require('browser-sync').create();
const postcss 			= require('gulp-postcss');
const svgSprite 		= require('gulp-svg-sprite');
const gulpIf 			= require('gulp-if');
const cssnano 			= require('gulp-cssnano');
const plumber 			= require('gulp-plumber');
const notify 			= require('gulp-notify');
const uglify 			= require('gulp-uglifyjs');
const concat 			= require('gulp-concat');
const cssnext 			= require('cssnext');
const postcssOpacity 	= require("postcss-opacity");
const postcssNested 	= require("postcss-nested");
const postcssClearfix 	= require("postcss-clearfix");
const cssMqpacker 		= require("css-mqpacker");
const csscomb 			= require('gulp-csscomb');
const rucksack 			= require('rucksack-css');
const newer 			= require('gulp-newer');
const debug 			= require('gulp-debug');
const remember 			= require('gulp-remember');
const cached 			= require('gulp-cached');
const imagemin 			= require('gulp-imagemin');
const pngquant 			= require('imagemin-pngquant');
const tinypng 			= require('gulp-tinypng');
const svg2png 			= require('gulp-svg2png');
const mjml 				= require('gulp-mjml');

const FAVICON_DATA_FILE = 'faviconData.json';
const theme_color = '#ffffff';

function getSiteName() {
	var domain = path.basename(__dirname);
	var root_folder = path.dirname(__dirname).split("/");
	root_folder = root_folder[root_folder.length - 1];

	var root_folder = root_folder.split(".");
	if (root_folder.length > 1) {
		root_folder[root_folder.length - 1] = 'dev';
	} else {
		root_folder.push('dev');
	}
	root_folder = root_folder.join('.');
	domain = root_folder+"/"+domain;
	console.log(domain);
	return domain;
}

var paths = {
	url: getSiteName(), 
	root: "./", 
	src: "_dev", 
	dst: "public", 
	images: {
		src: '/images/**/*.{jpg,png,svg,gif}',
		dst: '/images/'
	}, 
	files: {
		src: '/files/**/*.*',
		dst: '/files/'
	}, 
	templates: {
		src: '/**/*.{php,html,tpl,json}',
		dst: ''
	},
	js: {
		src: '/js/', 
		dst: '/js/'
	}, 
	css: {
		src: '/css/', 
		dst: '/css/'
	}
};

gulp.task('serve', function() {
	browserSync.init({
		open: false, 
		proxy: paths.url, 
		notify: false
	});

	browserSync.watch(paths.dst+'/**/*.*').on('change', browserSync.reload);
});

gulp.task('scripts', function(callback) {
	gulp.src([
		paths.src+paths.js.src+'three.js', 
		paths.src+paths.js.src+'d3.js', 
		paths.src+paths.js.src+'Projector.js', 
		paths.src+paths.js.src+'topojson.js', 
		paths.src+paths.js.src+'OrbitControls.js', 
		paths.src+paths.js.src+'Tween.js', 
		paths.src+paths.js.src+'myscripts.js'
	])
	.pipe(plumber({
			errorHandler: notify.onError(err => ({
			title: 'Scripts',
			message: err.message
		}))
	}))
	.pipe(cached('scripts'))
	.pipe(remember('scripts'))
	/*.pipe(uglify({
		mangle: true, 
		output: {
			beautify: true
		}
	}))*/
	.pipe(concat('webglearth.js'))
	.pipe(gulp.dest(paths.dst+paths.js.dst));

	callback();
});

gulp.task('styles', function(callback) {
	var processors = [
		postcssOpacity(), 
		postcssClearfix(), 
		postcssNested(), 
		cssMqpacker(), 
		rucksack(), 
		cssnext({
			"browsers": "last 5 versions"
		})
	];

	return gulp.src([paths.src+paths.css.src+'reset.css', paths.src+paths.css.src+'**/*.css'])
		.pipe(plumber({
				errorHandler: notify.onError(err => ({
				title: 'Styles',
				message: err.message
			}))
		}))
		.pipe(cached('styles'))
		.pipe(remember('styles'))
		.pipe(concat('style.min.css'))
		.pipe(postcss(processors))
		.pipe(cssnano({
			core: false, 
			autoprefixer: false, 
			discardComments: {removeAll: true}
		}))
		.pipe(csscomb())
		.pipe(gulp.dest(paths.dst+paths.css.dst));
});

gulp.task('templates', function(callback) {
	return gulp.src(paths.src+paths.templates.src, {base: '_dev/'})
		.pipe(plumber({
				errorHandler: notify.onError(err => ({
				title: 'Templates',
				message: err.message
			}))
		}))
		.pipe(newer(paths.dst))
		.pipe(gulp.dest(paths.dst));
});

gulp.task('files', function() {
	return gulp.src(paths.src+paths.files.src)
		.pipe(plumber({
				errorHandler: notify.onError(err => ({
				title: 'Files',
				message: err.message
			}))
		}))
		.pipe(newer(paths.dst+paths.files.dst))
		.pipe(imagemin({
			progressive: true,
			svgoPlugins: [
				{removeViewBox: false},
				{cleanupIDs: false}
			],
			use: [pngquant()]
		}))
		.pipe(gulp.dest(paths.dst+paths.files.dst));
});

gulp.task('images', function() {
	return gulp.src(paths.src+paths.images.src)
		.pipe(plumber({
				errorHandler: notify.onError(err => ({
				title: 'Images',
				message: err.message
			}))
		}))
		.pipe(newer(paths.dst+paths.images.dst))
		.pipe(gulpIf('{png,jpg}', tinypng('4ZqKPaFVLzm22rdBdxXLt67utMzi7Zqu'), imagemin({
			progressive: true,
			svgoPlugins: [
				{removeViewBox: false},
				{cleanupIDs: false}
			],
			use: [pngquant()]
		})))
		.pipe(gulp.dest(paths.dst+paths.images.dst));
});

gulp.task('clean', function() {
	return del(paths.dst);
});

gulp.task('watch', function() {
	gulp.watch(paths.src+paths.css.src, gulp.series('styles')).on('unlink', function(filepath) {
		remember.forget('styles', path.resolve(filepath));
		delete cached.caches.styles[path.resolve(filepath)];
	});
	gulp.watch(paths.src+paths.js.src, gulp.series('scripts')).on('unlink', function(filepath) {
		remember.forget('scripts', path.resolve(filepath));
		delete cached.caches.scripts[path.resolve(filepath)];
	});
	gulp.watch(paths.src+paths.files.src, gulp.series('files'));
	gulp.watch(paths.src+paths.images.src, gulp.series('images'));
	gulp.watch(paths.src+paths.templates.src, gulp.series('templates'));
});

gulp.task('default', gulp.series(gulp.parallel('templates', 'scripts', 'styles', 'files', 'images'), gulp.parallel('watch', 'serve')));

gulp.task('build', gulp.series('clean', gulp.parallel('templates', 'scripts', 'styles', 'files', 'images')));