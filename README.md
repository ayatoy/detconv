## Detective character encoding conversion for Node.js

Just combined [jschardet](https://github.com/aadsm/jschardet) and [iconv-lite](https://github.com/ashtuchkin/iconv-lite).

## Usage

### Function
```javascript
const detconv = require('detconv');

const unknownEncodedBuffer = Buffer.from(…);

const utf8EncodedBuffer = detconv.convert(unknownEncodedBuffer, 'utf-8');
```
An exception is thrown in the following cases:
* When input other than Buffer or string is given.
* When the encoding can not be detected.
* When the detected encodings are not supported by iconv-lite.
* When the encoding for conversion is not supported by iconv-lite.

### Transform stream
```javascript
const detconv = require('detconv');

const unknownEncodedReadStream = getUnknownEncodedReadStream();

const someWriteStream = getSomeWriteStream();

const detectAndConvert = detconv.convertStream('utf-8');

unknownEncodedReadStream.pipe(detectAndConvert).pipe(someWriteStream);
```
The 'error' event is emitted in the following cases:
* When chunk other than Buffer or string is given.
* When `detconv.convert()` throws an exception (because it is used in the implementation).

Depending on the characteristics of the detection method, all of the input chunks are concatenated and buffered. Please be aware that a footprint will be generated according to the input size and output will not occur unless the input is completed.

## Supported encodings

Encodings supported by [jschardet](https://github.com/aadsm/jschardet) and [iconv-lite](https://github.com/ashtuchkin/iconv-lite) can be used.
