import {isRuntimeTypeOf, Overwrite} from '@augment-vir/common';
import {appendJson, readJson} from '@augment-vir/node-js';
import {assert} from 'chai';
import {existsSync} from 'fs';
import {join} from 'path';
import {JsonObject, JsonValue, Promisable, SetOptional} from 'type-fest';
import {ExpectationKeys, pickTopKeyFromExpectationKeys} from './expectation-key';
import {CompareExpectationsOptions} from './expectation-options';

const defaultExpectationFile = join('test-files', 'test-expectations.json');

function accessExpectationAtKey(
    loadedExpectations: JsonObject,
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
    currentExpectationsFile: Readonly<JsonObject>,
    newResult: any,
    keys: Readonly<ExpectationKeys>,
): JsonObject {
    const topKey = pickTopKeyFromExpectationKeys(keys);
    const topKeyExpectationsObject = isRuntimeTypeOf(currentExpectationsFile[topKey], 'object')
        ? (currentExpectationsFile[topKey] as JsonObject)
        : {};

    const newExpectation = {
        [topKey]: {
            ...topKeyExpectationsObject,
            [keys.subKey]: newResult,
        },
    };

    return newExpectation as JsonObject;
}

export async function assertExpectation<ResultGeneric>({
    key,
    result,
    expectationFile,
    cwd,
    noOverwriteWhenDifferent,
    showFullError,
}: Readonly<CompareExpectationsOptions<ResultGeneric>>): Promise<void> {
    const workingDir = cwd || process.cwd();
    const expectationsFilePath = expectationFile || join(workingDir, defaultExpectationFile);
    if (!expectationsFilePath.endsWith('.json')) {
        throw new Error(
            `Expectations file path needs to end in .json but got "${expectationsFilePath}"`,
        );
    }

    const loadedExpectations = await readJson(expectationsFilePath);
    if (!isRuntimeTypeOf(loadedExpectations, 'object')) {
        throw new Error(
            `Expectations file "${expectationsFilePath}" did not contain an object. It should contain an object.`,
        );
    }

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

export async function assertExpectedOutput<ResultGeneric>(
    functionToExecute: () => Promisable<ResultGeneric>,
    options: Readonly<
        Omit<
            Overwrite<
                CompareExpectationsOptions<ResultGeneric>,
                {key: SetOptional<CompareExpectationsOptions<ResultGeneric>['key'], 'topKey'>}
            >,
            'result'
        >
    >,
): Promise<void> {
    const result: Readonly<ResultGeneric> = await functionToExecute();

    const completeOptions: Readonly<CompareExpectationsOptions<ResultGeneric>> = {
        ...options,
        key: {
            topKey: {function: functionToExecute},
            ...options.key,
        },
        result,
    };

    await assertExpectation(completeOptions);
}
