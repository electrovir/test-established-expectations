import {assertThrows, itCases, typedAssertNotNullish} from '@augment-vir/chai';
import {isRuntimeTypeOf, wrapNarrowTypeWithTypeCheck} from '@augment-vir/common';
import {randomString, readJson} from '@augment-vir/node-js';
import {assert} from 'chai';
import {existsSync} from 'fs';
import {readFile, unlink, writeFile} from 'fs/promises';
import {describe} from 'mocha';
import {assertExpectation, assertExpectedOutput} from './assert-expectations';
import {CompareExpectationsOptions} from './expectation-options';
import {expectationFiles} from './test-files.test-helper';

async function testThatOutputGotWritten({
    filePath,
    shouldFail,
}: {
    filePath: string;
    shouldFail: boolean;
}) {
    const options: CompareExpectationsOptions<string> = {
        key: {
            topKey: randomString(),
            subKey: randomString(),
        },
        result: randomString(),
        expectationFile: filePath,
    };
    if (shouldFail) {
        await assertThrows(assertExpectation(options));
    } else {
        await assertExpectation(options);
    }
    await assertExpectation(options);
}

async function testThatMissingFileGotWritten(filePath: string) {
    await testThatOutputGotWritten({
        filePath,
        shouldFail: true,
    });

    assert.isTrue(existsSync(filePath), `'${filePath}' should exist after the assertion`);
}

const simpleOptions: CompareExpectationsOptions<string> = {
    key: {
        topKey: 'topKey',
        subKey: 'subKey',
    },
    result: 'result',
    expectationFile: expectationFiles.fullExpectationFile,
};

describe(assertExpectation.name, () => {
    it('should write result when the file is missing', async () => {
        assert.isFalse(
            existsSync(expectationFiles.missingExpectationFile),
            `missing file should not exist before the assertion`,
        );
        await testThatMissingFileGotWritten(expectationFiles.missingExpectationFile);

        await unlink(expectationFiles.missingExpectationFile);
    });

    it('should write result when the file is empty', async () => {
        assert.isEmpty(await readFile(expectationFiles.emptyExpectationFile));
        await testThatMissingFileGotWritten(expectationFiles.emptyExpectationFile);
        await writeFile(expectationFiles.emptyExpectationFile, '');
    });

    it('fails if saved expectation group is not an object', async () => {
        await assertThrows(
            assertExpectation({
                key: {
                    topKey: 'topKey',
                    subKey: 'subKey',
                },
                result: 'result',
                expectationFile: expectationFiles.nonObjectChildExpectationFile,
            }),
            {
                matchMessage: /^Expectation group at top key .+ is not an object\.?$/,
            },
        );
    });

    it('should not modify other subKeys when they exist already', async () => {
        const beforeTestFileContents = await readFile(expectationFiles.fullExpectationFile);

        const options = wrapNarrowTypeWithTypeCheck<CompareExpectationsOptions<string>>()({
            key: {
                topKey: 'this is the top key',
                subKey: 'this is an invalid sub key',
            },
            result: 'result',
            expectationFile: expectationFiles.fullExpectationFile,
        } as const);

        const parsedBeforeTestFileContents = JSON.parse(beforeTestFileContents.toString());

        assert.isNotEmpty(parsedBeforeTestFileContents[options.key.topKey]);
        assert.doesNotHaveAnyKeys(parsedBeforeTestFileContents[options.key.topKey], [
            options.key.subKey,
        ]);

        await assertThrows(assertExpectation(options), {
            matchMessage: 'No expectation exists under keys',
        });

        const afterTestJson = await readJson(expectationFiles.fullExpectationFile);

        typedAssertNotNullish(afterTestJson);

        if (!isRuntimeTypeOf(afterTestJson, 'object')) {
            assert.isObject(afterTestJson);
            assert.isNotArray(afterTestJson);
            throw new Error('afterTestJson was not an object');
        }

        const topKeyPart = afterTestJson[options.key.topKey];

        assert.deepStrictEqual(topKeyPart, {
            ...parsedBeforeTestFileContents[options.key.topKey],
            [options.key.subKey]: 'result',
        });
        await writeFile(expectationFiles.fullExpectationFile, beforeTestFileContents);
    });

    itCases(assertExpectation, [
        {
            it: 'should pass when the output exists',
            input: {
                key: {
                    topKey: 'this is the top key',
                    subKey: 'this is the sub key',
                },
                result: 'fifty-two',
                expectationFile: expectationFiles.fullExpectationFile,
            },
            throws: undefined,
        },
        {
            it: 'should pass when a Date object is used',
            input: {
                key: {
                    topKey: 'this is the top key',
                    subKey: 'this is a date key',
                },
                result: {
                    thisHasDate: new Date(1000),
                },
                expectationFile: expectationFiles.fullExpectationFile,
            },
            throws: undefined,
        },
        {
            it: 'should pass when using another sub key',
            input: {
                key: {
                    topKey: 'this is the top key',
                    subKey: 'this is another sub key',
                },
                result: 'fifty-shoe',
                expectationFile: expectationFiles.fullExpectationFile,
            },
            throws: undefined,
        },
        {
            it: 'should pass when using another sub key',
            input: {
                key: {
                    topKey: 'this is the top key',
                    subKey: 'this is another sub key',
                },
                result: 'not the actual result',
                noOverwriteWhenDifferent: true,
                showFullError: true,
                expectationFile: expectationFiles.fullExpectationFile,
            },
            throws: /to deeply equal/,
        },
        {
            it: 'should fail when output is wrong',
            input: {
                key: {
                    topKey: 'this is the top key',
                    subKey: 'this is the sub key',
                },
                result: 'fifty-three',
                expectationFile: expectationFiles.fullExpectationFile,
                noOverwriteWhenDifferent: true,
            },
            throws: Error,
        },
        {
            it: 'should fail with showFullError off',
            input: {
                key: {
                    topKey: 'this is the top key',
                    subKey: 'this is the sub key',
                },
                result: 'fifty-three',
                expectationFile: expectationFiles.fullExpectationFile,
                noOverwriteWhenDifferent: true,
                showFullError: false,
            },
            throws: Error,
        },
        {
            it: 'should fail with showFullError on',
            input: {
                key: {
                    topKey: 'this is the top key',
                    subKey: 'this is the sub key',
                },
                result: 'fifty-three',
                expectationFile: expectationFiles.fullExpectationFile,
                noOverwriteWhenDifferent: true,
                showFullError: true,
            },
            throws: Error,
        },
        {
            it: 'should fail when an empty topKey is given',
            input: {
                ...simpleOptions,
                key: {
                    ...simpleOptions.key,
                    topKey: '',
                },
            },
            throws: 'Got an empty topKey',
        },
        {
            it: 'should fail when an empty subKey is given',
            input: {
                ...simpleOptions,
                key: {
                    ...simpleOptions.key,
                    subKey: '',
                },
            },
            throws: 'Got an empty subKey',
        },
        {
            it: 'should fail when a non-json file is given',
            input: {
                ...simpleOptions,
                expectationFile: randomString(),
            },
            throws: 'needs to end in .json',
        },
        {
            it: 'should fail when the expectation file does not contain an object at the root',
            input: {
                ...simpleOptions,
                expectationFile: expectationFiles.notAnObjectExpectationFile,
            },
            throws: 'should contain an object',
        },
        {
            it: 'should work with default file',
            input: {
                ...simpleOptions,
                expectationFile: '',
            },
            throws: undefined,
        },
    ]);
});

describe(assertExpectedOutput.name, () => {
    it("should assert a function's output", async () => {
        function testFunction() {
            return 'this is the output';
        }

        await assertExpectedOutput(testFunction, {
            key: {
                subKey: 'basic output',
            },
            expectationFile: expectationFiles.fullExpectationFile,
        });
    });

    it('should expect inputs if the functionToTest requires them', async () => {
        function testFunctionWithInputs(a: string) {
            return `return ${a}`;
        }

        await assertExpectedOutput(
            testFunctionWithInputs,
            {
                key: {
                    subKey: 'basic inputs',
                },
            },
            'test input',
        );
    });

    it('stores errors as the result', async () => {
        await assertExpectedOutput(
            () => {
                throw new Error('error thrown here');
            },
            {
                key: {
                    topKey: 'assertExpectedOutput',
                    subKey: 'catches error',
                },
            },
        );
    });
});
