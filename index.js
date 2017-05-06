'use strict';

const Buffer = require('buffer').Buffer;
const Transform = require('stream').Transform;
const jschardet = require('jschardet');
const iconv = require('iconv-lite');

const detconv = module.exports;

const normalizeCharsetName = name => name.toLowerCase().replace(/_/g, '-');

detconv.convert = (input, encoding) => {
    let str = null;
    if (input instanceof Buffer) {
        const detected = jschardet.detect(input);
        if (!detected.encoding) return null;
        const inputEncoding = normalizeCharsetName(detected.encoding);
        if (!iconv.encodingExists(inputEncoding)) return null;
        str = iconv.decode(input, inputEncoding);
    } else {
        str = input;
    }
    const outputEncoding = normalizeCharsetName(encoding || 'utf-8');
    if (!iconv.encodingExists(outputEncoding)) return null;
    return iconv.encode(str, outputEncoding);
};

class DetconvConvertStream extends Transform {
    constructor(encoding, options) {
        super(options);
        this._encoding = encoding;
        this._buffer = null;
    }
    _transform(chunk, encoding, done) {
        if (!this._buffer) this._buffer = chunk;
        else if (chunk instanceof Buffer) this._buffer = Buffer.concat([this._buffer, chunk]);
        else this._buffer += chunk;
        done();
    }
    _flush(done) {
        if (!this._buffer) return done();
        const buf = detconv.convert(this._buffer, this._encoding);
        this._buffer = null;
        if (!buf) return done(new Error('Conversion failed.'));
        this.push(buf);
        done();
    }
}

detconv.DetconvConvertStream = DetconvConvertStream;
detconv.convertStream = encoding => new DetconvConvertStream(encoding);
