import gulp from "gulp";
import gulpSass from "gulp-sass";
import * as dartSasss from "sass";
import browserSync from "browser-sync";
import sourcemaps from "gulp-sourcemaps";
import autoprefixer from "gulp-autoprefixer";
import cleanCss from "gulp-clean-css";
import plumber from "gulp-plumber";
import htmlmin from "gulp-htmlmin";
import ttf2woff2 from "gulp-ttf2woff2";
import imagemin, { mozjpeg, optipng, svgo } from "gulp-imagemin";
import { deleteAsync } from "del";

const sass = gulpSass(dartSasss);
const browser = browserSync.create();

// Пути к папкам
// src - исходники
// serve - папка локального сервера, для разоаботки
// dest - итоговая сборка
const paths = {
	styles: {
		src: "src/sass/**/*.sass",
		serve: "serve",
		dest: "dist",
	},
	html: {
		src: "src/index.html",
		serve: "serve",
		dest: "dist",
	},
	images: {
		src: "src/imgs/*",
		serve: "serve/imgs",
		dest: "dist/imgs",
	},
	fonts: {
		src: "src/fonts/*.{ttf,otf,svg}",
		serve: "serve/fonts",
		dest: "dist/fonts",
	},
};

// == ЗАДАНИЯ НА КОМПИЛЯЦИЮ ==

// Компиляция sass в css для разработки. Подключаем plumber, sourcemap И логирование
const stylesDev = () => {
	return gulp
		.src(paths.styles.src)
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(sass().on("error", sass.logError))
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest(paths.styles.serve))
		.pipe(browser.stream());
};

// Компиляция sass в css для production. Компилируем, добавляем префиксы и чистим
const stylesBuild = () => {
	return gulp
		.src(paths.styles.src)
		.pipe(sass().on("error", sass.logError))
		.pipe(autoprefixer())
		.pipe(cleanCss())
		.pipe(gulp.dest(paths.styles.dest));
};

// Компиляция html для разработки. Подключаем plumber и следим за изменениями
const htmlDev = () => {
	return gulp
		.src(paths.html.src)
		.pipe(plumber())
		.pipe(gulp.dest(paths.html.serve))
		.pipe(browser.stream());
};

// Компиляция html для production. Сжимаем содержимое файла
const htmlBuild = () => {
	return gulp
		.src(paths.html.src)
		.pipe(
			htmlmin({
				collapseWhitespace: true,
				conservativeCollapse: true,
				removeComments: true,
				removeEmptyAttributes: true,
				removeScriptTypeAttributes: true,
				removeStyleLinkTypeAttributes: true,
			}),
		)
		.pipe(gulp.dest(paths.html.dest));
};

// Картинки для разработки. Просто переносим
const imagesDev = () => {
	return gulp
		.src(paths.images.src, { encoding: false })
		.pipe(plumber())
		.pipe(gulp.dest(paths.images.serve));
};

// Картинки для production. Используем сжатие
const imagesBuild = () => {
	return gulp
		.src(paths.images.src, { encoding: false })
		.pipe(
			imagemin(
				[
					mozjpeg({ quality: 90, progressive: true }),
					optipng({ optimizationLevel: 3 }),
					svgo({
						plugins: [
							{ name: "removeViewBox", active: false }, //не ломает SVG
						],
					}),
				],
				{
					verbose: true, // логирование в консоль
				},
			),
		)
		.pipe(gulp.dest(paths.images.dest));
};

// Шрифты для разработки. Просто переносим
const fontsDev = () => {
	return gulp
		.src(paths.fonts.src, { encoding: false })
		.pipe(gulp.dest(paths.fonts.serve));
};

// Шрифты для production. Крнвертируем в woff2 и переносим
const fontsBuild = () => {
	return gulp
		.src(paths.fonts.src, { encoding: false })
		.pipe(ttf2woff2({ clone: true }))
		.pipe(gulp.dest(paths.fonts.dest));
};

// == ВСПОМОГАТЕЛЬНЫЕ ЗАДАНИЯ ==

// Создаем локальный сервер для разработки
const serve = () => {
	browser.init({
		server: {
			baseDir: "./serve",
		},
		notify: false,
	});
};

// Очищаем папку dist
const clean = () => {
	return deleteAsync(["dist/**"]);
};

// Следим за изменением файлов и вызываем соответствующие команды для обновления при разработке
const watch = () => {
	gulp.watch(paths.styles.src, stylesDev);
	gulp.watch(paths.html.src, htmlDev);
	gulp.watch(paths.images.src, imagesDev).on("change", browser.reload);
	gulp.watch(paths.fonts.src, fontsDev).on("change", browser.reload);
};

// == ЭКСПОРТЫ ==

// Команда dev для разработки
export const dev = gulp.series(
	gulp.parallel(htmlDev, stylesDev, imagesDev, fontsDev), // Компилируем файлы
	gulp.parallel(watch, serve), // Запускаем сервер и следим за изменениями
);

// Команда build для сборки
export const build = gulp.series(
	clean, // очищаем папку перед каждой сборкой
	gulp.parallel(htmlBuild, stylesBuild, imagesBuild, fontsBuild), // Компилируем и собираем файлы
);
