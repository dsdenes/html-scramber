const request = require('request');
const jsObfuscator = require('js-obfuscator');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

module.exports = async function (srcPath) {
  const srcFile = path.basename(srcPath);

  execSync(`cd "${process.cwd()}" && rm -rf dist && mkdir -p dist && cp src/* dist/`);

  const $ = cheerio.load(fs.readFileSync(srcPath), { normalizeWhitespace: true, xmlMode: false, decodeEntities: false });
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

    } else {
      jsCode = $scriptElem.html();
    }

    try {
      const obfuscatedCode = await jsObfuscator(jsCode);

      $scriptElem.removeAttr('src');
      $scriptElem.html(obfuscatedCode);
      console.log(`Finished ${++i} / ${$scriptTags.length - 1}`)

    } catch (err) {
      console.log(err, jsCode);
    }
  }));

  console.log('Obfustaction finished.');
  fs.writeFileSync(`dist/${srcFile}`, $.html());
};

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

function isRemote(src) {
  return /^(http:|https:)?\/\//.test(src);
}
