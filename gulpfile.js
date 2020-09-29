const { src, dest, watch } = require('gulp')
const sass = require('gulp-sass')
sass.compiler = require('node-sass')

const sassOptions = { outputStyle: 'compact' }

function css(cb) {
  src('./css/*.scss').pipe(sass(sassOptions).on('error', sass.logError)).pipe(dest('./css'))
  cb()
}

exports.default = function () {
  watch('css/*.scss', css)
}
