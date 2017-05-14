'use strict';

const assert = require('chai').assert;
const Buffer = require('buffer').Buffer;
const fs = require('fs');
const path = require('path');
const jschardet = require('jschardet');
const iconv = require('iconv-lite');
const detconv = require(path.join(__dirname, '..'));

const normalizeCharsetName = name => {
  if (typeof name === 'string')
    return name.toLowerCase().replace(/(-|_)/g, '');
  return name;
};

const bufferEqual = (buf1, buf2) => {
  if (buf1.length !== buf2.length)
   return false;
  for (let i = 0; i < buf1.length; i++)
    if (buf1[i] !== buf2[i])
      return false;
  return true;
};

const convertTest = (spec, done) => {
  let fromBuf = new Buffer(0);
  fs.createReadStream(spec.lipsum)
  .on('error', done)
  .on('data', chunk => fromBuf = Buffer.concat([fromBuf, chunk]))
  .on('end', () => {
    try {
      const fromDet = jschardet.detect(fromBuf);
      if (!fromDet.encoding || !iconv.encodingExists(fromDet.encoding) || !iconv.encodingExists(spec.toEncoding)) {
        assert.throws(() => detconv.convert(fromBuf, spec.toEncoding), Error);
        return done();
      }
      const toBuf = detconv.convert(fromBuf, spec.toEncoding);
      const toDet = jschardet.detect(toBuf);
      assert.oneOf(
        normalizeCharsetName(fromDet.encoding),
        spec.fromEncodings.map(normalizeCharsetName)
      );
      assert.oneOf(
        normalizeCharsetName(toDet.encoding),
        spec.toEncodings.map(normalizeCharsetName)
      );
      if (normalizeCharsetName(spec.fromEncoding) !== normalizeCharsetName(spec.toEncoding) || fromDet.encoding !== toDet.encoding) {
        assert.isNotOk(bufferEqual(fromBuf, toBuf));
      }
      done();
    } catch (e) {
      done(e);
    }
  });
};

const convertStreamTest = (spec, done) => {
  let fromBuf = new Buffer(0);
  let toBuf = new Buffer(0);
  let maybeErr = false;
  fs.createReadStream(spec.lipsum)
  .on('error', done)
  .on('data', chunk => fromBuf = Buffer.concat([fromBuf, chunk]))
  .on('end', () => {
    const fromDet = jschardet.detect(fromBuf);
    if (!fromDet.encoding || !iconv.encodingExists(fromDet.encoding) || !iconv.encodingExists(spec.toEncoding)) {
      maybeErr = true;
    }
  })
  .pipe(detconv.convertStream(spec.toEncoding))
  .on('error', err => {
    try {
      assert.isOk(maybeErr);
      done();
    } catch (e) {
      done(e);
    }
  })
  .on('data', chunk => toBuf = Buffer.concat([toBuf, chunk]))
  .on('end', () => {
    try {
      const fromDet = jschardet.detect(fromBuf);
      const toDet = jschardet.detect(toBuf);
      assert.oneOf(
        normalizeCharsetName(fromDet.encoding),
        spec.fromEncodings.map(normalizeCharsetName)
      );
      assert.oneOf(
        normalizeCharsetName(toDet.encoding),
        spec.toEncodings.map(normalizeCharsetName)
      );
      if (normalizeCharsetName(spec.fromEncoding) !== normalizeCharsetName(spec.toEncoding) || fromDet.encoding !== toDet.encoding) {
        assert.isNotOk(bufferEqual(fromBuf, toBuf));
      }
      done();
    } catch (e) {
      done(e);
    }
  });
};

const specs = [
  {
    lipsum: path.join(__dirname, 'lipsum', 'chinese', 'big5'),
    fromEncoding: 'big5', toEncoding: 'gb2313',
    fromEncodings: ['big5'], toEncodings :['gb2313', 'gb18030'],
  },
  {
    lipsum: path.join(__dirname, 'lipsum', 'greek', 'iso-8859-7'),
    fromEncoding: 'iso-8859-7', toEncoding: 'utf-8',
    fromEncodings: ['iso-8859-7'], toEncodings: ['utf-8'],
  },
  {
    lipsum: path.join(__dirname, 'lipsum', 'greek', 'utf-8'),
    fromEncoding: 'utf-8', toEncoding: 'windows-1253',
    fromEncodings: ['utf-8'], toEncodings: ['windows-1253', 'iso-8859-7'],
  },
  {
    lipsum: path.join(__dirname, 'lipsum', 'hebrew', 'utf-8'),
    fromEncoding: 'utf-8', toEncoding: 'iso-8859-8',
    fromEncodings: ['utf-8'], toEncodings: ['iso-8859-8', 'windows-1255'],
  },
  {
    lipsum: path.join(__dirname, 'lipsum', 'japanese', 'euc-jp'),
    fromEncoding: 'euc-jp', toEncoding: 'shift-jis',
    fromEncodings: ['euc-jp'], toEncodings: ['shift-jis'],
  },
  {
    lipsum: path.join(__dirname, 'lipsum', 'japanese', 'iso-2022-jp'),
    fromEncoding: 'iso-2022-jp', toEncoding: 'utf-8',
    fromEncodings: ['iso-2022-jp'], toEncodings: ['utf-8'],
  },
  {
    lipsum: path.join(__dirname, 'lipsum', 'korean', 'utf-8'),
    fromEncoding: 'utf-8', toEncoding: 'euc-kr',
    fromEncodings: ['utf-8'], toEncodings: ['euc-kr'],
  },
  {
    lipsum: path.join(__dirname, 'lipsum', 'korean', 'euc-kr'),
    fromEncoding: 'euc-kr', toEncoding: 'iso-2022-kr',
    fromEncodings: ['euc-kr'], toEncodings: ['iso-2022-kr'],
  },
  {
    lipsum: path.join(__dirname, 'lipsum', 'russian', 'maccyrillic'),
    fromEncoding: 'maccyrillic', toEncoding: 'iso-8859-5',
    fromEncodings: ['maccyrillic'], toEncodings: ['iso-8859-5'],
  },
  {
    lipsum: path.join(__dirname, 'lipsum', 'russian', 'ibm855'),
    fromEncoding: 'ibm855', toEncoding: 'koi8-r',
    fromEncodings: ['ibm855'], toEncodings: ['koi8-r'],
  },
];

describe('detconv.convert()', function() {
  specs.forEach(spec => {
    it(spec.fromEncoding + ' → ' + spec.toEncoding, function(done) {
      convertTest(spec, done);
    });
  });
});

describe('detconv.convertStream()', function() {
  specs.forEach(spec => {
    it(spec.fromEncoding + ' → ' + spec.toEncoding, function(done) {
      convertStreamTest(spec, done);
    });
  });
});
