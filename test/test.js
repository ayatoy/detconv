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

const verify = (spec, state) => {
  assert.isNotOk(state.err);
  assert.oneOf(
    normalizeCharsetName(state.srcDet.encoding),
    spec.src.guess.map(normalizeCharsetName)
  );
  assert.oneOf(
    normalizeCharsetName(state.dstDet.encoding),
    spec.dst.guess.map(normalizeCharsetName)
  );
  if (spec.src.encoding === 'string') {
    assert.isString(state.src);
  }
  if (spec.dst.encoding === 'string') {
    assert.isString(state.dst);
  }
  if (spec.src.encoding !== 'string') {
    assert.isOk(Buffer.isBuffer(state.src));
  }
  if (spec.dst.encoding !== 'string') {
    assert.isOk(Buffer.isBuffer(state.dst));
  }
  if (spec.src.encoding === 'string' &&
      spec.dst.encoding === 'string') {
    assert.isOk(state.src === state.dst);
  }
  if (spec.src.encoding !== 'string' &&
      spec.dst.encoding !== 'string' &&
      spec.src.encoding !== spec.dst.encoding) {
    assert.isNotOk(bufferEqual(state.src, state.dst));
  }
};

const convertTest = (spec, done) => {
  const state = {
    src: new Buffer(0),
    srcDet: null,
    dst: null,
    dstDet: null,
    err: false,
  };
  fs.createReadStream(spec.src.path)
  .on('error', done)
  .on('data', chunk => state.src = Buffer.concat([state.src, chunk]))
  .on('end', () => {
    try {
      if (spec.src.encoding === 'string') {
        state.src = state.src.toString('utf8');
        state.srcDet = { encoding: 'string' };
      } else {
        state.srcDet = jschardet.detect(state.src);
      }
      if (state.srcDet.encoding !== 'string' && !state.srcDet.encoding) {
        assert.throws(() => detconv.convert(state.src, spec.dst.encoding), Error);
        return done();
      }
      if (state.srcDet.encoding !== 'string' && !iconv.encodingExists(state.srcDet.encoding)) {
        assert.throws(() => detconv.convert(state.src, spec.dst.encoding), Error);
        return done();
      }
      if (spec.dst.encoding !== 'string' && !iconv.encodingExists(spec.dst.encoding)) {
        assert.throws(() => detconv.convert(state.src, spec.dst.encoding), Error);
        return done();
      }
      state.dst = detconv.convert(state.src, spec.dst.encoding);
      if (spec.dst.encoding === 'string') {
        state.dstDet = { encoding: 'string' };
      } else {
        state.dstDet = jschardet.detect(state.dst);
      }
      verify(spec, state);
      done();
    } catch (e) {
      done(e);
    }
  });
};

const convertStreamTest = (spec, done) => {
  const state = {
    src: new Buffer(0),
    srcDet: null,
    dst: null,
    dstDet: null,
    err: false,
  };
  fs.createReadStream(spec.src.path)
  .on('error', done)
  .on('data', chunk => state.src = Buffer.concat([state.src, chunk]))
  .on('end', () => {
    try {
      if (spec.src.encoding === 'string') {
        state.src = state.src.toString('utf8');
        state.srcDet = { encoding: 'string' };
      } else {
        state.srcDet = jschardet.detect(state.src);
      }
      if (state.srcDet.encoding !== 'string' && !state.srcDet.encoding) {
        state.err = true;
      }
      if (state.srcDet.encoding !== 'string' && !iconv.encodingExists(state.srcDet.encoding)) {
        state.err = true;
      }
      if (spec.dst.encoding !== 'string' && !iconv.encodingExists(spec.dst.encoding)) {
        state.err = true;
      }
      const converter = detconv.convertStream(spec.dst.encoding);
      converter.on('error', err => {
        try {
          assert.isOk(state.err);
          done();
        } catch (e) {
          done(e);
        }
      })
      .on('data', chunk => {
        if (Buffer.isBuffer(chunk)) {
          if (!state.dst) state.dst = chunk;
          else state.dst = Buffer.concat([state.dst, chunk]);
        } else if (typeof chunk === 'string') {
          if (!state.dst) state.dst = chunk;
          else state.dst += chunk;
        }
      })
      .on('end', () => {
        try {
          if (spec.dst.encoding === 'string') {
            state.dstDet = { encoding: 'string' };
          } else {
            state.dstDet = jschardet.detect(state.dst);
          }
          verify(spec, state);
          done();
        } catch (e) {
          done(e)
        };
      });
      converter.write(state.src);
      converter.end();
    } catch (e) {
      done(e);
    }
  });
};

const specs = [
  {
    src: {
      path: path.join(__dirname, 'lipsum', 'chinese', 'big5'),
      encoding: 'big5',
      guess: ['big5'],
    },
    dst: {
      encoding: 'gb2312',
      guess: ['gb2312', 'gb18030'],
    },
  },
  {
    src: {
      path: path.join(__dirname, 'lipsum', 'chinese', 'utf-8'),
      encoding: 'string',
      guess: ['string'],
    },
    dst: {
      encoding: 'utf-8',
      guess: ['utf-8'],
    }
  },
  {
    src: {
      path: path.join(__dirname, 'lipsum', 'chinese', 'big5'),
      encoding: 'big5',
      guess: ['big5'],
    },
    dst: {
      encoding: 'string',
      guess: ['string'],
    },
  },
  {
    src: {
      path: path.join(__dirname, 'lipsum', 'greek', 'iso-8859-7'),
      encoding: 'iso-8859-7',
      guess: ['iso-8859-7'],
    },
    dst: {
      encoding: 'utf-8',
      guess: ['utf-8'],
    },
  },
  {
    src: {
      path: path.join(__dirname, 'lipsum', 'greek', 'utf-8'),
      encoding: 'utf-8',
      guess: ['utf-8'],
    },
    dst: {
      encoding: 'windows-1253',
      guess: ['windows-1253', 'iso-8859-7'],
    },
  },
  {
    src: {
      path: path.join(__dirname, 'lipsum', 'greek', 'utf-8'),
      encoding: 'string',
      guess: ['string'],
    },
    dst: {
      encoding: 'windows-1253',
      guess: ['windows-1253', 'iso-8859-7'],
    },
  },
  {
    src: {
      path: path.join(__dirname, 'lipsum', 'hebrew', 'utf-8'),
      encoding: 'utf-8',
      guess: ['utf-8'],
    },
    dst: {
      encoding: 'iso-8859-8',
      guess: ['iso-8859-8', 'windows-1255'],
    },
  },
  {
    src: {
      path: path.join(__dirname, 'lipsum', 'hebrew', 'utf-8'),
      encoding: 'utf-8',
      guess: ['utf-8'],
    },
    dst: {
      encoding: 'string',
      guess: ['string'],
    },
  },
  {
    src: {
      path: path.join(__dirname, 'lipsum', 'japanese', 'euc-jp'),
      encoding: 'euc-jp',
      guess: ['euc-jp'],
    },
    dst: {
      encoding: 'shift-jis',
      guess: ['shift-jis'],
    },
  },
  {
    src: {
      path: path.join(__dirname, 'lipsum', 'japanese', 'iso-2022-jp'),
      encoding: 'iso-2022-jp',
      guess: ['iso-2022-jp'],
    },
    dst: {
      encoding: 'utf-8',
      guess: ['utf-8'],
    },
  },
  {
    src: {
      path: path.join(__dirname, 'lipsum', 'japanese', 'utf-8'),
      encoding: 'string',
      guess: ['string'],
    },
    dst: {
      encoding: 'euc-jp',
      guess: ['euc-jp'],
    },
  },
  {
    src: {
      path: path.join(__dirname, 'lipsum', 'japanese', 'shift-jis'),
      encoding: 'shift-jis',
      guess: ['shift-jis'],
    },
    dst: {
      encoding: 'string',
      guess: ['string'],
    },
  },
  {
    src: {
      path: path.join(__dirname, 'lipsum', 'korean', 'utf-8'),
      encoding: 'utf-8',
      guess: ['utf-8'],
    },
    dst: {
      encoding: 'euc-kr',
      guess: ['euc-kr'],
    },
  },
  {
    src: {
      path: path.join(__dirname, 'lipsum', 'korean', 'euc-kr'),
      encoding: 'euc-kr',
      guess: ['euc-kr'],
    },
    dst: {
      encoding: 'iso-2022-kr',
      guess: ['iso-2022-kr'],
    },
  },
  {
    src: {
      path: path.join(__dirname, 'lipsum', 'korean', 'euc-kr'),
      encoding: 'euc-kr',
      guess: ['euc-kr'],
    },
    dst: {
      encoding: 'string',
      guess: ['string'],
    },
  },
  {
    src: {
      path: path.join(__dirname, 'lipsum', 'russian', 'maccyrillic'),
      encoding: 'maccyrillic',
      guess: ['maccyrillic'],
    },
    dst: {
      encoding: 'iso-8859-5',
      guess: ['iso-8859-5'],
    },
  },
  {
    src: {
      path: path.join(__dirname, 'lipsum', 'russian', 'ibm855'),
      encoding: 'ibm855',
      guess: ['ibm855'],
    },
    dst: {
      encoding: 'koi8-r',
      guess: ['koi8-r'],
    },
  },
  {
    src: {
      path: path.join(__dirname, 'lipsum', 'russian', 'utf-8'),
      encoding: 'string',
      guess: ['string'],
    },
    dst: {
      encoding: 'koi8-r',
      guess: ['koi8-r'],
    },
  },
];

describe('detconv.convert()', function() {
  specs.forEach(spec => {
    it(spec.src.encoding + ' → ' + spec.dst.encoding, function(done) {
      convertTest(spec, done);
    });
  });
});

describe('detconv.convertStream()', function() {
  specs.forEach(spec => {
    it(spec.src.encoding + ' → ' + spec.dst.encoding, function(done) {
      convertStreamTest(spec, done);
    });
  });
});

describe('detconv.DetconvConvertStream', function() {
  it('instanceof', function() {
    assert.instanceOf(detconv.convertStream(), detconv.DetconvConvertStream);
  });
});
