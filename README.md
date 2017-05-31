## Detective character encoding conversion for Node.js [![Build Status](https://travis-ci.org/ayatoy/detconv.svg?branch=master)](https://travis-ci.org/ayatoy/detconv)

Just combined [jschardet](https://github.com/aadsm/jschardet) and [iconv-lite](https://github.com/ashtuchkin/iconv-lite).

[![NPM](https://nodei.co/npm/detconv.png?compact=true)](https://nodei.co/npm/detconv/)

## Usage

### Function

#### detconv.convert(input[, encoding[, confidence]])

* `input` - Buffer or string. If a Buffer, it tries to detect the encoding. If a string, it will be interpreted as is without attempting to detect it.
* `encoding` - output encoding. `detconv.convert` usually returns an encoded buffer, but if `'string'`, it returns a string without conversion. Default is `'utf-8'`.
* `confidence` - acceptable accuracy. Greater then or equal to 0, less then or equal to 1. Closer to 1 is, higher accuracy required. If not specified, any accuracy is acceptable.

```javascript
const detconv = require('detconv');

const unknownEncodedBuffer = Buffer.from(…);

const utf8EncodedBuffer = detconv.convert(unknownEncodedBuffer, 'utf-8');
```

An exception is thrown in the following cases:
* `input` other than Buffer or string is given.
* Encoding can not be detected.
* Detected accuracy is less than `confidence`.
* Detected encodings is not supported by iconv-lite.
* `encoding` is not supported by iconv-lite.

### Transform stream

#### detconv.convertStream([encoding[, confidence]])

```javascript
const detconv = require('detconv');

const unknownEncodedReadStream = getUnknownEncodedReadStream();

const someWriteStream = getSomeWriteStream();

const detectAndConvert = detconv.convertStream('utf-8');

unknownEncodedReadStream.pipe(detectAndConvert).pipe(someWriteStream);
```

The 'error' event is emitted in the following cases:
* When chunk other than Buffer or string is given.
* `detconv.convert()` throws an exception (because it is used in the implementation).

Depending on the characteristics of the detection method, all of the input chunks are concatenated and buffered. Please be aware that a footprint will be generated according to the input size and output will not occur unless the input is completed.

## Supported encodings

Encodings that can be input are those supported by [jschardet](https://github.com/aadsm/jschardet) and [iconv-lite](https://github.com/ashtuchkin/iconv-lite). Encodings that can be output are those supported by [iconv-lite](https://github.com/ashtuchkin/iconv-lite). In addition, both input and output can be string.

## Test

```bash
$ git clone https://github.com/ayatoy/detconv.git
$ cd detconv
$ npm install
$ npm test
```

## License

MIT
