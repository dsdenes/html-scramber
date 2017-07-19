const obfuscator = require('./obfuscator');
const srcFile = process.argv[2] ? process.argv[2] : 'src/index.html';
obfuscator(srcFile)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));