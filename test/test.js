const assert = require('assert');
const rollup = require('rollup').rollup;
const minify = require('uglify-js').minify;
const readFile = require('fs').readFileSync;
const uglify = require('../');

process.chdir('test');

it('should minify', () => {
    return rollup({
        entry: 'fixtures/unminified.js',
        plugins: [ uglify() ]
    }).then(bundle => {
        const unminified = readFile('fixtures/unminified.js', 'utf-8');
        const result = bundle.generate({
            format: 'cjs'
        });
        assert.equal(result.code.trim(), minify(unminified, { fromString: true }).code.trim());
    });
});

it('should minify via uglify options', () => {
    return rollup({
        entry: 'fixtures/empty.js',
        plugins: [ uglify({
            output: { comments: 'all' }
        }) ]
    }).then(bundle => {
        const result = bundle.generate({
            banner: '/* package name */',
            format: 'cjs'
        });

        assert.equal(result.code, '/* package name */\n"use strict";\n');
    });
});

it('should minify with sourcemaps', () => {
    return rollup({
        entry: 'fixtures/sourcemap.js',
        plugins: [ uglify() ]
    }).then(bundle => {
        const result = bundle.generate({
            format: 'cjs',
            sourceMap: true
        });

        assert.ok(result.map, 'has a source map');
        assert.equal(result.map.version, 3, 'source map has expected version');
        assert.ok(Array.isArray(result.map.sources), 'source map has sources array');
        assert.equal(result.map.sources.length, 2, 'source map has two sources');
        assert.ok(Array.isArray(result.map.names), 'source maps has names array');
        assert.ok(result.map.mappings, 'source map has mappings');
    });
});

it('should allow passing minifier', () => {
    const expectedCode = readFile('fixtures/plain-file.js', 'utf-8');
    const testOptions = {
        foo: 'bar'
    };

    return rollup({
        entry: 'fixtures/plain-file.js',
        plugins: [ uglify(testOptions, (code, options) => {
            assert.ok(code, 'has unminified code');
            assert.equal(code, expectedCode.trim(), 'expected file content is passed to minifier');
            assert.ok(options, 'has minifier options');
            assert.equal(options.foo, 'bar', 'minifier gets custom options');

            return { code };
        })]
    }).then(bundle => {
        const result = bundle.generate();

        assert.ok(result.code, 'result has return code');
        assert.equal(result.code.trim(), expectedCode.trim(), 'result code has expected content');
    });
});

