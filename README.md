# cyve/webpage-metrics

Node.js command to extract metrics from a webpage

## Installation
```bash
$ npm install https://github.com/cyve/webpage-metrics/tarball/master
```

## Usage
```bash
$ node wpm <url>
$ node wpm <url> --format=json
$ node wpm <url> --format=urlencoded
```

## Metrics

- `requests` Number of external requests (images, styleSheets, iframes, etc.)
- `domElements` Number of elements in the DOM
- `totalSize` Total size in byte (including assets)
- `ecoindex` Page's [ecoindex](http://www.ecoindex.fr)
- `serverTime` Server response duration
- `renderTime` DOM rendering duration
- `totalTime` Time to the `load` event

## Help
```bash
$ node wpm --help
```
