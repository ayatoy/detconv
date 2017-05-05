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
