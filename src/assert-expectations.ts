import {
    AnyFunction,
    ensureError,
    extractErrorMessage,
    isRuntimeTypeOf,
    JsonCompatibleValue,
    Overwrite,
} from '@augment-vir/common';
import {appendJson, readJson} from '@augment-vir/node-js';
import {assert} from 'chai';
import {existsSync} from 'fs';
import {join} from 'path';
import {JsonValue, SetOptional} from 'type-fest';
import {ExpectationKeys, pickTopKeyFromExpectationKeys} from './expectation-key';
import {CompareExpectationsOptions} from './expectation-options';

const defaultExpectationFile = join('test-files', 'test-expectations.json');

type SavedExpectations = Record<string, SavedExpectation>;
type SavedExpectation = Record<string, JsonCompatibleValue>;

function accessExpectationAtKey(
    loadedExpectations: SavedExpectations,
    keys: ExpectationKeys,
): {
    value: JsonValue | undefined;
    extractedKeys: ExpectationKeys<string>;
} {
    const topKey = pickTopKeyFromExpectationKeys(keys);

    if (!topKey) {
        throw new Error(`Got an empty topKey from ExpectationKeys.`);
    }

    if (!keys.subKey) {
        throw new Error(`Got an empty subKey from ExpectationKeys.`);
    }

    const outerValue = loadedExpectations[topKey];

    const extractedKeys = {
        topKey,
        subKey: keys.subKey,
    };

    if (!isRuntimeTypeOf(outerValue, 'object')) {
        return {
            value: undefined,
            extractedKeys,
        };
    }
    return {
        value: outerValue[keys.subKey] as JsonValue | undefined,
        extractedKeys,
    };
}

function createNewExpectation(
    currentExpectationsFileContents: Readonly<SavedExpectations>,
    newResult: any,
    keys: Readonly<ExpectationKeys>,
): SavedExpectation {
    const topKey = pickTopKeyFromExpectationKeys(keys);
    const topKeyExpectationsObject = isRuntimeTypeOf(
        currentExpectationsFileContents[topKey],
        'object',
    )
        ? currentExpectationsFileContents[topKey]
        : {};

    const newExpectation = {
        [topKey]: {
            ...topKeyExpectationsObject,
            [keys.subKey]: newResult,
        },
    };

    return newExpectation;
}

export async function assertExpectation<ResultGeneric>({
    key,
    result,
    expectationFile,
    cwd,
    noOverwriteWhenDifferent,
    showFullError = !!process.env.CI,
}: Readonly<CompareExpectationsOptions<ResultGeneric>>): Promise<void> {
    const workingDir = cwd || process.cwd();
    const expectationsFilePath = expectationFile || join(workingDir, defaultExpectationFile);
    if (!expectationsFilePath.endsWith('.json')) {
        throw new Error(
            `Expectations file path needs to end in .json but got "${expectationsFilePath}"`,
        );
    }

    const loadedExpectations = (await readJson(expectationsFilePath)) ?? {};
    assertValidSavedExpectations(loadedExpectations, expectationsFilePath);

    const {value: expectedExpectation, extractedKeys} = accessExpectationAtKey(
        loadedExpectations,
        key,
    );

    let assertionError: unknown = undefined;

    // put the result through the parser so that it matches the stringified result already saved
    const jsonParsedResult = JSON.parse(JSON.stringify(result));

    try {
        assert.deepStrictEqual<any>(jsonParsedResult, expectedExpectation);
    } catch (error) {
        assertionError = error;
    }

    const expectationsFileExistedAlready = existsSync(expectationsFilePath);

    if (
        // use triple equals here to intentionally exclude null values
        expectedExpectation === undefined ||
        (assertionError && !noOverwriteWhenDifferent)
    ) {
        await appendJson(
            expectationsFilePath,
            createNewExpectation(loadedExpectations, jsonParsedResult, key),
            {includeTrailingNewLine: true},
        );
    }
    const writingItNowMessage = noOverwriteWhenDifferent
        ? ''
        : '\nCreating it now. Run test again to compare saved output.';

    if (!expectationsFileExistedAlready) {
        throw new Error(
            `Expectation file '${expectationsFilePath}' does not yet exist.${writingItNowMessage}`,
        );
    }

    if (expectedExpectation === undefined) {
        throw new Error(
            `No expectation exists under keys '${extractedKeys.topKey}' => '${extractedKeys.subKey}'.${writingItNowMessage}`,
        );
    }

    if (assertionError) {
        if (showFullError) {
            throw assertionError;
        } else {
            throw new Error(
                `Expectation for key '${extractedKeys.topKey}' => '${extractedKeys.subKey}' failed.`,
            );
        }
    }
}

function assertValidSavedExpectations(
    input: unknown,
    expectationsFilePath: string,
): asserts input is SavedExpectations {
    if (!isRuntimeTypeOf(input, 'object')) {
        throw new Error(
            `Expectations file '${expectationsFilePath}' did not contain an object. It should contain an object.`,
        );
    }
    Object.keys(input).forEach((topKey) => {
        const topKeyValue = input[topKey];

        if (!isRuntimeTypeOf(topKeyValue, 'object')) {
            throw new Error(
                `Expectation group at top key '${topKey}' in expectation file '${expectationsFilePath}' is not an object.`,
            );
        }
    });
}

export type AssertExpectedOutputOptions = Readonly<
    Omit<
        Overwrite<
            CompareExpectationsOptions<unknown>,
            {
                key: SetOptional<CompareExpectationsOptions<unknown>['key'], 'topKey'>;
            }
        >,
        'result'
    >
>;

export async function assertExpectedOutput<FunctionToTestGeneric extends AnyFunction>(
    functionToExecute: FunctionToTestGeneric,
    options: AssertExpectedOutputOptions,
    ...inputs: Parameters<FunctionToTestGeneric>
): Promise<void> {
    let result: unknown;
    try {
        result = await functionToExecute(...inputs);
    } catch (maybeError) {
        const error = ensureError(maybeError);
        result = `${error.name}: ${extractErrorMessage(error)}`;
    }

    const completeOptions: Readonly<CompareExpectationsOptions<typeof result>> = {
        ...options,
        key: {
            topKey: {function: functionToExecute},
            ...options.key,
        },
        result,
    };

    await assertExpectation(completeOptions);
}
