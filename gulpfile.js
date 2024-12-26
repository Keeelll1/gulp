"use strict";

const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const rename = require('gulp-rename');
const cleanCSS = require('gulp-clean-css');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const htmlmin = require('gulp-htmlmin');
const newer = require('gulp-newer');
const browsersync = require('browser-sync').create();
const plumber = require('gulp-plumber');

// Пути до папки dist
const path = {
    styles: {
        src: ['src/styles/**/*.sass', 'src/styles/**/*.scss'], 
        dest: 'dist/css/'
    },
    scripts: {
        src: 'src/scripts/**/*.js',
        dest: 'dist/js/'
    },
    images: {
        src: 'src/images/**/*',
        dest: 'dist/images'
    },
    html: {
        src: 'src/*.html',
        dest: 'dist'
    }
}

function handleError(err) {
    console.error(err.toString());
    this.emit('end');
}

// Задача для минимализации HTML
async function html() {
    const size = (await import('gulp-size')).default;

    return gulp.src(path.html.src)
        .pipe(plumber({ errorHandler: handleError }))
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(size())
        .pipe(gulp.dest(path.html.dest))
        .pipe(browsersync.stream());
}

// Задача для обработки стилей
async function styles() {
    const autoprefixer = await import('gulp-autoprefixer');
    const size = (await import('gulp-size')).default;

    return gulp.src(path.styles.src)
        .pipe(plumber({ errorHandler: handleError }))
        .pipe(sass({ silent: true }).on('error', sass.logError))
        .pipe(autoprefixer.default({
            cascade: false,
            overrideBrowserslist: ["> 0.5%", "last 3 versions"]
        }))
        .pipe(cleanCSS({
            level: 2
        }))
        .pipe(rename({
            basename: 'main',
            suffix: '.min'
        }))
        .pipe(size())
        .pipe(gulp.dest(path.styles.dest))
        .pipe(browsersync.stream());
}

// Задача для обработки скриптов
async function scripts() {
    const size = (await import('gulp-size')).default;

    return gulp.src(path.scripts.src, { sourcemaps: true })
        .pipe(plumber({ errorHandler: handleError }))
        .pipe(sourcemaps.init())
        .pipe(babel({ presets: ['@babel/env'] }))
        .pipe(uglify().on('error', handleError))
        .pipe(concat('main.min.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(size())
        .pipe(gulp.dest(path.scripts.dest))
        .pipe(browsersync.stream());
}

// Задача для сжатия изображений
async function img() {
    const imagemin = (await import('gulp-imagemin')).default;
    const mozjpeg = (await import('imagemin-mozjpeg')).default;
    const pngquant = (await import('imagemin-pngquant')).default;
    const webp = (await import('imagemin-webp')).default;
    const gifsicle = (await import('imagemin-gifsicle')).default;
    const svgo = (await import('imagemin-svgo')).default;
    const size = (await import('gulp-size')).default;

    return gulp.src(path.images.src)
        .pipe(newer(path.images.dest))
        .pipe(plumber({ errorHandler: handleError }))
        .pipe(imagemin([
            gifsicle({interlaced: true}),
            mozjpeg({quality: 75, progressive: true}),
            pngquant({ quality: [0.65, 0.80], speed: 4 }),
            webp({ quality: 75 }),
            svgo({
                plugins: [
                    { name: 'removeViewBox', active: true }
                ]
            })
        ]))
        .pipe(size())
        .pipe(gulp.dest(path.images.dest));
}

// Отслеживание изменений
function watch() {
    browsersync.init({
        server: {
            baseDir: './dist/'
        }
    })
    gulp.watch(path.html.dest).on('change', browsersync.reload)
    gulp.watch(path.html.src, html);
    gulp.watch(path.styles.src, styles);
    gulp.watch(path.scripts.src, scripts);
    gulp.watch(path.images.src, img);
}

// Задача билд
const build = gulp.series(html, gulp.parallel(styles, scripts, img));
const dev = gulp.series(build, gulp.parallel(watch));

exports.styles = styles;
exports.scripts = scripts;
exports.img = img;
exports.html = html;
exports.watch = watch;
exports.build = build;
exports.dev = dev;
exports.default = dev;