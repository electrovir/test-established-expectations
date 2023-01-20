# test-established-expectations

Snapshot testing in chai using json files without automatic file population. Meaning, the first time you run the tests, they automatically populate the snapshots.

Note that because JSON values are compared, some inputs may be parsed unexpectedly. For example, `Map` objects will simply get stringified as `{}`.

## Usage

### Installation

```bash
npm i -D test-established-expectations
```

You most likely want this a dev dependency (since it's meant for testing), hence the `-D`.

### `assertExpectedOutput`

The most basic usage is with `assertExpectedOutput`. It accepts a function, calls it, and compares its output to the previously stored output:

<!-- example-link: src/readme-examples/assert-expected-output.example.ts -->

```TypeScript
import {describe, it} from 'mocha';
import {assertExpectedOutput} from 'test-established-expectations';

function myFunctionToTest() {
    return 'dummy function';
}

describe(myFunctionToTest.name, () => {
    it('should match expected output', async () => {
        await assertExpectedOutput(myFunctionToTest, {
            key: {
                subKey: 'basic expectation',
            },
        });
    });
});
```

### `assertExpectation`

`assertExpectation` is a more versatile alternative, as it doesn't rely on a function being input. For `assertExpectation` to work, you must already have the `result` or output that you need to compare.

<!-- example-link: src/readme-examples/assert-expectation-with-function-key.example.ts -->

```TypeScript
import {describe, it} from 'mocha';
import {assertExpectation} from 'test-established-expectations';

function myFunctionToTest() {
    return 'dummy function';
}

describe(myFunctionToTest.name, () => {
    it('should match expected output with function as key', async () => {
        const result = myFunctionToTest();

        await assertExpectation({
            key: {
                topKey: {function: myFunctionToTest},
                subKey: 'basic expectation with function key',
            },
            result,
        });
    });
});
```

### Other top keys

Other top key options that match common testing methods: `{describe: 'my test key'}`, `{context: 'my test key'}`:

<!-- example-link: src/readme-examples/assert-expectation-with-describe-key.example.ts -->

```TypeScript
import {describe, it} from 'mocha';
import {assertExpectation} from 'test-established-expectations';

function myFunctionToTest() {
    return 'dummy function';
}

describe(myFunctionToTest.name, () => {
    it('should match expected output', async () => {
        const result = myFunctionToTest();

        await assertExpectation({
            key: {
                // the topKey here extracts the function name manually
                topKey: {describe: myFunctionToTest.name},
                subKey: 'basic expectation',
            },
            result,
        });
    });
});
```

You can also just use a string for ultimate flexibility:

<!-- example-link: src/readme-examples/assert-expectation.example.ts -->

```TypeScript
import {describe, it} from 'mocha';
import {assertExpectation} from 'test-established-expectations';

function myFunctionToTest() {
    return 'dummy function';
}

describe(myFunctionToTest.name, () => {
    it('should match expected output', async () => {
        const result = myFunctionToTest();

        await assertExpectation({
            key: {
                // the topKey here is a string
                topKey: 'my test',
                subKey: 'basic expectation',
            },
            result,
        });
    });
});
```

### Keys

`topKey` and `subKey` are used to store the expected outputs in a nested JSON file object structure. This way, it's easy to mirror a test file's `describe`, `it` structure (describe for the `topKey`, it for the `subKey`).

### Expectation file

A custom expectation file can be chosen with `expectationFile`:

<!-- example-link: src/readme-examples/custom-json-file.example.ts -->

```TypeScript
import {describe, it} from 'mocha';
import {assertExpectedOutput} from 'test-established-expectations';

function myFunctionToTest() {
    return 'dummy function';
}

describe(myFunctionToTest.name, () => {
    it('should match expected output', async () => {
        await assertExpectedOutput(myFunctionToTest, {
            key: {
                subKey: 'basic expectation',
            },
            // use a custom json file to store expectations
            expectationFile: 'my-json-file.json',
        });
    });
});
```

### Prevent overwriting stored values

By default, these assertions overwrite the expectations file with the latest results. This makes it easy to compare failures and to generate initial expectations. If you wish to disable this feature, set `noOverwriteWhenDifferent` to `true`:

<!-- example-link: src/readme-examples/no-overwrite-file.example.ts -->

```TypeScript
import {describe, it} from 'mocha';
import {assertExpectedOutput} from 'test-established-expectations';

function myFunctionToTest() {
    return 'dummy function';
}

describe(myFunctionToTest.name, () => {
    it('should match expected output', async () => {
        await assertExpectedOutput(myFunctionToTest, {
            key: {
                subKey: 'basic expectation',
            },
            // prevent overwriting the stored expectations when this expectation fails
            noOverwriteWhenDifferent: true,
        });
    });
});
```
