"use strict";

const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const rename = require('gulp-rename');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
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
function html() {
    return gulp.src(path.html.src)
        .pipe(plumber({ errorHandler: handleError }))
        .pipe(gulp.dest(path.html.dest))
        .pipe(browsersync.stream());
}

// Задача для обработки стилей
async function styles() {
    const autoprefixer = await import('gulp-autoprefixer');

    return gulp.src(path.styles.src)
        .pipe(plumber({ errorHandler: handleError }))
        .pipe(sass({ silent: true }).on('error', sass.logError))
        .pipe(sourcemaps.init())
        .pipe(autoprefixer.default({
            cascade: false,
            overrideBrowserslist: ["> 0.5%", "last 3 versions"]
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(path.styles.dest))
        .pipe(browsersync.stream());
}

// Задача для обработки скриптов
async function scripts() {

    return gulp.src(path.scripts.src, { sourcemaps: true })
        .pipe(plumber({ errorHandler: handleError }))
        .pipe(sourcemaps.init())
        .pipe(babel({ presets: ['@babel/env'] }))
        .pipe(concat('main.js'))
        .pipe(sourcemaps.write('.'))
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