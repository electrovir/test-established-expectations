import {typedAssertInstanceOf} from '@augment-vir/chai';
import {assert} from 'chai';
import {expectationCases} from './expectation-cases';
import {expectationFiles} from './test-files.test-helper';

function testNamedFunction(first: number, second: string) {
    return `${first}-${second}`;
}

describe(expectationCases.name, () => {
    expectationCases(testNamedFunction, [
        {
            it: 'creates some basic output',
            inputs: [
                42,
                'hello there',
            ],
        },
        {
            it: 'creates more advanced output',
            inputs: [
                1.23456,
                `string with ${'interpolation'}`,
            ],
        },
    ]);

    let caughtError: unknown;

    try {
        expectationCases(
            (singleInput: string) => singleInput,
            [
                {
                    it: 'creates some basic output',
                    input: 'just one string',
                },
            ],
        );
    } catch (error) {
        caughtError = error;
    }
    typedAssertInstanceOf(caughtError, Error);
    assert.include(caughtError.message, 'Please pass a testKey to expectationCases');

    try {
        expectationCases((singleInput: string) => singleInput, []);
    } catch (error) {
        caughtError = error;
    }
    typedAssertInstanceOf(caughtError, Error);
    assert.include(caughtError.message, 'No test cases');

    expectationCases(
        (singleInput: string) => singleInput,
        {
            testKey: 'single input',
        },
        [
            {
                it: 'creates some basic output',
                input: 'just one string',
            },
        ],
    );

    expectationCases(
        () => 'hi',
        {
            testKey: 'empty inputs function',
            expectationFile: expectationFiles.fullExpectationFile,
        },
        [
            {
                it: 'should do something',
            },
        ],
    );
});
