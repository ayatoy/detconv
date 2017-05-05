'use strict';

var Buffer = require('buffer').Buffer;
var Transform = require('stream').Transform;
var jschardet = require('jschardet');
var iconv = require('iconv-lite');

var detconv = module.exports;

function normalizeCharsetName(name) {
    return name.toLowerCase().replace(/_/g, '-');
}

detconv.convert = function convert(input, encoding) {
    var str = null;
    if (input instanceof Buffer) {
        var detected = jschardet.detect(input);
        if (!detected.encoding) {
            return null;
        }
        var inputEncoding = normalizeCharsetName(detected.encoding);
        if (!iconv.encodingExists(inputEncoding)) {
            return null;
        }
        str = iconv.decode(input, inputEncoding);
    } else {
        str = input;
    }
    var outputEncoding = normalizeCharsetName(encoding || 'utf-8');
    if (!iconv.encodingExists(outputEncoding)) {
        return null;
    }
    return iconv.encode(str, outputEncoding);
}
