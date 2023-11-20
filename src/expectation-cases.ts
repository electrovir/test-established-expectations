import {FunctionTestCase} from '@augment-vir/chai';
import {AnyFunction, filterObject} from '@augment-vir/common';
import {isRunTimeType} from 'run-time-assertions';
import {AssertExpectedOutputOptions, assertExpectedOutput} from './assert-expectations';

export const runExpectationCases = expectationCases;

export type ExpectationTestCast<FunctionToTestGeneric extends AnyFunction> = Omit<
    FunctionTestCase<FunctionToTestGeneric>,
    'throws' | 'expect'
>;

export type ExpectationCasesOptions = {
    testKey?: string | undefined;
} & Partial<Omit<AssertExpectedOutputOptions, 'key'>>;

export function expectationCases<FunctionToTestGeneric extends AnyFunction>(
    functionToTest: FunctionToTestGeneric,
    testCases: ReadonlyArray<ExpectationTestCast<FunctionToTestGeneric>>,
): void;
export function expectationCases<FunctionToTestGeneric extends AnyFunction>(
    functionToTest: FunctionToTestGeneric,
    options: ExpectationCasesOptions,
    testCases: ReadonlyArray<ExpectationTestCast<FunctionToTestGeneric>>,
): void;
export function expectationCases<FunctionToTestGeneric extends AnyFunction>(
    functionToTest: FunctionToTestGeneric,
    optionsOrTestCases:
        | ExpectationCasesOptions
        | ReadonlyArray<ExpectationTestCast<FunctionToTestGeneric>>,
    maybeTestCases?: ReadonlyArray<ExpectationTestCast<FunctionToTestGeneric>>,
): void {
    const options: ExpectationCasesOptions = isRunTimeType(optionsOrTestCases, 'array')
        ? {}
        : optionsOrTestCases;

    const testCases: ReadonlyArray<ExpectationTestCast<FunctionToTestGeneric>> = isRunTimeType(
        optionsOrTestCases,
        'array',
    )
        ? optionsOrTestCases
        : (maybeTestCases as ReadonlyArray<ExpectationTestCast<FunctionToTestGeneric>>);

    if (!testCases.length) {
        throw new Error(`No test cases were provided to '${expectationCases.name}'`);
    }

    const testTopKey: string = options.testKey || functionToTest.name || '';
    if (!testTopKey) {
        throw new Error(
            `Provided functionToTest is an anonymous function with no name but testKey was not provided. Please pass a testKey to expectationCases, or use a named function.`,
        );
    }

    const removeOptionKeys: ReadonlyArray<keyof typeof options> = [
        'testKey',
    ];

    const additionalOptions = filterObject(options, (key) => {
        return !removeOptionKeys.includes(key);
    });

    testCases.forEach((testCase) => {
        /** Can't test coverage of this as it'll affect the other tests */
        // istanbul ignore next
        const itFunction = testCase.exclude ? it.skip : testCase.force ? it.only : it;

        itFunction(testCase.it, async () => {
            const inputs: Parameters<FunctionToTestGeneric> =
                'inputs' in testCase
                    ? (testCase.inputs as Parameters<FunctionToTestGeneric>)
                    : 'input' in testCase
                      ? ([testCase.input] as Parameters<FunctionToTestGeneric>)
                      : ([] as unknown as Parameters<FunctionToTestGeneric>);

            await assertExpectedOutput(
                functionToTest,
                {
                    key: {
                        subKey: testCase.it,
                        topKey: testTopKey,
                    },
                    ...additionalOptions,
                },
                ...inputs,
            );
        });
    });
}
