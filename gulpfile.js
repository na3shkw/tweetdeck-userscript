const fs = require("fs");
const gulp = require("gulp");
const header = require("gulp-header");
const ejs = require("gulp-ejs");
const rename = require("gulp-rename");
const browserify = require("browserify");
const source = require("vinyl-source-stream");
const tsify = require("tsify");
require("dotenv").config();

const pkg = require("./package.json");
const metaTemplate = fs.readFileSync("src/meta.ejs", "utf8");

const build = () => {
    return browserify({ entries: ["src/index.ts"] })
        .plugin(tsify)
        .bundle()
        .pipe(source("index.user.js"))
        .pipe(header(metaTemplate, { pkg }))
        .pipe(gulp.dest("dist"));
}

const watch = () => {
    return gulp.watch("src/**/*.ts", build)
}

const loader = () => {
    return gulp.src("src/meta.local.ejs")
        .pipe(ejs({ pkg, process }))
        .pipe(rename({
            basename: "local.user",
            extname: ".js"
        }))
        .pipe(gulp.dest("dist"));
}

exports.default = build;
exports.watch = watch;
exports.loader = loader;
