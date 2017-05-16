'use strict';

const Buffer = require('buffer').Buffer;
const Transform = require('stream').Transform;
const jschardet = require('jschardet');
const iconv = require('iconv-lite');

const detconv = module.exports;

const normalizeCharsetName = name => {
  if (typeof name === 'string') {
    return name.toLowerCase().replace(/_/g, '-');
  }
  return 'utf-8';
}

detconv.convert = (input, encoding) => {
  let str = null;
  if (Buffer.isBuffer(input)) {
    const detected = jschardet.detect(input);
    if (!detected.encoding) {
      throw new Error('detection failed');
    }
    const inputEncoding = normalizeCharsetName(detected.encoding);
    if (!iconv.encodingExists(inputEncoding)) {
      throw new Error('input encoding does not exists: ' + inputEncoding);
    }
    str = iconv.decode(input, inputEncoding);
  } else if (typeof input === 'string') {
    str = input;
  } else {
    throw new Error('input must be Buffer or string: ' + input);
  }
  const outputEncoding = normalizeCharsetName(encoding);
  if (outputEncoding === 'string') {
    return str;
  }
  if (!iconv.encodingExists(outputEncoding)) {
    throw new Error('output encoding does not exists: ' + outputEncoding);
  }
  return iconv.encode(str, outputEncoding);
};

class DetconvConvertStream extends Transform {
  constructor(encoding, options) {
    super(options);
    this._encoding = encoding;
    this._buffer = null;
  }
  _transform(chunk, encoding, done) {
    if (Buffer.isBuffer(chunk)) {
      if (!this._buffer) this._buffer = chunk;
      else this._buffer = Buffer.concat([this._buffer, chunk]);
    } else if (typeof chunk === 'string') {
      if (!this._buffer) this._buffer = chunk;
      else this._buffer += chunk;
    } else {
      return done(new Error('input must be Buffer or string: ' + chunk));
    }
    done();
  }
  _flush(done) {
    if (!this._buffer) return done();
    try {
      this.push(detconv.convert(this._buffer, this._encoding));
      done();
    } catch (e) {
      done(e);
    } finally {
      this._buffer = null;
    }
  }
}

detconv.DetconvConvertStream = DetconvConvertStream;
detconv.convertStream = encoding => new DetconvConvertStream(encoding);
