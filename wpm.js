#!/usr/bin/env node

const zlib = require('zlib');
const input = require('commander');
const puppeteer = require('puppeteer');
const ecoindex = require('ecoindex');

(async () => {
    input
        .arguments('<arg>')
        .action(arg => url = arg)
        .option('-f, --format <format>', 'Output format (ex: json or urlencoded).')
        .parse(process.argv);

    try {
        new URL(url);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }

    var browser = await puppeteer.launch();
    var page = await browser.newPage();
    var metrics = { requests: 0, totalSize: 0 };

    // get number of external requests
    await page.on('request', request => {
        if (!request.url().startsWith('data:')) {
            metrics.requests++;
        }
    });

    // get total uncompressed size
    await page.on('response', response => {
        if (response.ok()) {
            switch (response.headers()['content-encoding']) {
                case 'br':
                    response.buffer().then(buffer => {
                        zlib.brotliCompress(buffer, function (_, result) {
                            metrics.totalSize += result.length;
                        });
                    });
                    break;
                case 'gzip':
                    response.buffer().then(buffer => {
                        zlib.gzip(buffer, function (_, result) {
                            metrics.totalSize += result.length;
                        });
                    });
                    break;
                case 'deflate':
                    response.buffer().then(buffer => {
                        zlib.deflate(buffer, function (_, result) {
                            metrics.totalSize += result.length;
                        });
                    });
                    break;
                default:
                    response.buffer().then(buffer => {
                        metrics.totalSize += buffer.length;
                    });
                    break;
            }
        }
    });

    await page.goto(url);

    // get number of DOM elements
    metrics.domElements = await page.evaluate(() => document.querySelectorAll('*').length);

    // calculate ecoindex
    metrics.ecoindex = ecoindex.calculate(metrics.domElements, metrics.requests, Math.round(metrics.totalSize / 1024));

    // get performance metrics
    var performance = await page.evaluate(() => window.performance.toJSON());
    metrics.serverTime = performance.timing.responseStart - performance.timing.fetchStart;
    metrics.renderTime = performance.timing.domComplete - performance.timing.domLoading;
    metrics.totalTime = performance.timing.loadEventEnd - performance.timing.navigationStart;

    // Master request performance => https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigation
    // var navigationPerformance = JSON.parse(await page.evaluate(() => JSON.stringify(window.performance.getEntriesByType('navigation'))));

    // Resources performance => https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming
    // var resourcePerformances = JSON.parse(await page.evaluate(() => JSON.stringify(window.performance.getEntriesByType('resource'))));

    await browser.close();

    if (input.format === 'json') {
        process.stdout.write(JSON.stringify(metrics));
        process.exit(0);
    }

    if (input.format === 'urlencoded') {
        var params = new URLSearchParams();
        for (var prop in metrics) {
            params.append(prop, metrics[prop]);
        }

        process.stdout.write(params.toString());
        process.exit(0);
    }

    for (var prop in metrics) {
        process.stdout.write(prop.padEnd(12, ' ') + metrics[prop] + "\n");
    }

    var exit = function (signal) {
        process.exit(0);
    };

    process.on('SIGINT', exit);
    process.on('SIGQUIT', exit);
    process.on('SIGTERM', exit);

    exit();
})();
