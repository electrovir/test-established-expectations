import {itCases} from '@augment-vir/chai';
import {describe} from 'mocha';
import {pickTopKeyFromExpectationKeys} from './expectation-key';

describe(pickTopKeyFromExpectationKeys.name, () => {
    itCases(pickTopKeyFromExpectationKeys, [
        {
            it: 'should error on anonymous function key',
            input: {
                topKey: {
                    function: () => {},
                },
            },
            throws: /key cannot use anonymous functions, they must be named/,
        },
        {
            it: 'should extract named function key',
            input: {
                topKey: {
                    function: function namedFunction() {},
                },
            },
            expect: 'namedFunction',
        },
        {
            it: 'should extract describe key',
            input: {
                topKey: {
                    describe: 'yolo',
                },
            },
            expect: 'yolo',
        },
        {
            it: 'should extract context key',
            input: {
                topKey: {
                    context: 'bolo',
                },
            },
            expect: 'bolo',
        },
        {
            it: 'should extract key',
            input: {
                topKey: 'apparently bolo is a word cause it passes spellcheck',
            },
            expect: 'apparently bolo is a word cause it passes spellcheck',
        },
        {
            it: 'should error if more keys are given',
            input: {
                topKey: {
                    context: 'what',
                    describe: 'oops',
                },
            },
            throws: /can only have one key/,
        },
        {
            it: 'should error if no keys are given',
            input: {
                topKey: {} as any,
            },
            throws: /needs a valid key/,
        },
    ]);
});
