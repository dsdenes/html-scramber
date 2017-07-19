const gulp = require('gulp');
const source = require('vinyl-source-stream');
const request = require('request');
const merge = require('merge2');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const closureCompiler = require('google-closure-compiler-js').compile;
const gulpClosure = require('google-closure-compiler-js').gulp();
const obfuscator = require('gulp-js-obfuscator');
const jsObfuscator = require('js-obfuscator');
// const jsfuck = require('gulp-jsfuck');
const buffer = require('gulp-buffer');
const wrap = require('gulp-wrap');
const cheerio = require('cheerio');
const pump = require('pump');
const fs = require('fs');
const path = require('path');

gulp.task('default', async function() {

  try {
    fs.unlinkSync('inline.js');
  } catch (err) {

  }

  const $ = cheerio.load(fs.readFileSync('src/index.html'), { normalizeWhitespace: false, xmlMode: false, decodeEntities: false });
  $('head').append('<script type="text/javascript" src="../redirect.js"></script>');

  const $scriptTags = $('script');

  console.log('Starting inline obfuscation...');

  let i = 0;
  await Promise.all($scriptTags.get().map(async (scriptElem) => {
    const $scriptElem = $(scriptElem);
    const src = $scriptElem.attr('src');

    let jsCode;
    if (src && isRemote(src)) {
      jsCode = await getRemoteFile();

    } else if (src) {
      jsCode = new Buffer(fs.readFileSync(path.join('src', src))).toString();
      // scripts.push(getLocalStream(path.join('src', src)));
      // $scriptElem.remove();

    } else {
      jsCode = $scriptElem.html();
    }

    const flags = {
      jsCode: [{src: jsCode}],
      compilationLevel: 'SIMPLE',
      warningLevel: 'QUIET',
      // outputWrapper: '(function(){\n%output%\n}).call(this)',
      createSourceMap: false
    };

    try {
      // const closureCompiled = closureCompiler(flags);
      const obfuscatedCode = await jsObfuscator(jsCode);

      $scriptElem.removeAttr('src');
      $scriptElem.html(obfuscatedCode);
      console.log(`Finished ${++i} / ${$scriptTags.length - 1}`)

    } catch (err) {
      console.log(err, jsCode);
    }

  }));

  function getRemoteFile(src) {
    return new Promise((resolve, reject) => {
      request.get(src, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          resolve(body);
        } else {
          reject(error);
        }
      });
    });
  }

  // // console.log($scriptTags.get());
  // process.exit(0);
  //
  // // let i = 0;
  // await Promise.all($scriptTags.map(async (i, scriptTag) => {
  //   const src = $(scriptTag).attr('src');
  //
  //   if (src && isRemote(src)) {
  //     scripts.push(getRemoteStream(src));
  //     $scriptTags.eq(i).remove();
  //
  //   } else if (src) {
  //     scripts.push(getLocalStream(path.join('src', src)));
  //     $scriptTags.eq(i).remove();
  //
  //   } else {
  //     const flags = {
  //       jsCode: [{src: $(scriptTag).html()}],
  //       compilationLevel: 'SIMPLE',
  //       warningLevel: 'QUIET',
  //       outputWrapper: '(function(){\n%output%\n}).call(this)',
  //       createSourceMap: false
  //     };
  //
  //     const closureCompiled = closureCompiler(flags);
  //     const obfuscatedCode = await jsObfuscator(closureCompiled.compiledCode);
  //
  //     $(scriptTag).html(obfuscatedCode);
  //     console.log(`Finished ${++i} / ${$scriptTags.length}`)
  //   }
  // }));

  console.log('Obfustaction finished.');

  // $script.remove();
  // $('head').append('<script type="text/javascript" src="./build.js"></script>');
  fs.writeFileSync('dist/index.html', $.html());

  function isRemote(src) {
    return /^(http:|https:)?\/\//.test(src);
  }

  // function getLocalStream(localUri) {
  //   return gulp.src(localUri);
  //     // .pipe(wrap(`;(()=>{<%= contents %>})();`));
  // }
  //
  // function getRemoteStream(remoteUri) {
  //   return request(remoteUri)
  //     .pipe(source(`script-${encodeURIComponent(remoteUri)}.js`));
  //     // .pipe(wrap(`;(()=>{<%= contents %>})();`));
  // }
  //
  // return new Promise((resolve, reject) => {
  //   pump([
  //     merge.apply(null, scripts),
  //     buffer(),
  //     gulpClosure({
  //       compilationLevel: 'SIMPLE',
  //       warningLevel: 'QUIET',
  //       outputWrapper: '(function(){\n%output%\n}).call(this)',
  //       jsOutputFile: 'output.min.js',
  //       createSourceMap: false,
  //     }),
  //     // uglify(),
  //     // obfuscator(),
  //     concat('build.js'),
  //     gulp.dest('dist')
  //   ], resolve);
  // });

    //
    // .pipe(buffer())
    // .pipe(concat('build.js'))
    // .pipe(uglify())
    // .pipe(gulp.dest('dist'));
});