import {
    AnyFunction,
    assertRuntimeTypeOf,
    createDeferredPromiseWrapper,
    RequireNonVoid,
    TypedFunction,
} from '@augment-vir/common';
import {assertExpectedOutput} from './assert-expectations';
import {CompareExpectationsOptions} from './expectation-options';

type SnapshotTestBaseCase = {
    it: string;
    force?: true;
};

type SnapshotTestCaseSingleInput<FunctionToTestGeneric extends AnyFunction> = {
    input: Parameters<FunctionToTestGeneric>[0];
} & SnapshotTestBaseCase;

type SnapshotTestCaseMultiInput<FunctionToTestGeneric extends AnyFunction> = {
    inputs: Parameters<FunctionToTestGeneric>;
} & SnapshotTestBaseCase;

type SnapshotTestCase<FunctionToTestGeneric extends AnyFunction> =
    Parameters<FunctionToTestGeneric> extends []
        ? SnapshotTestBaseCase
        : Parameters<FunctionToTestGeneric> extends [any?]
        ? SnapshotTestCaseSingleInput<FunctionToTestGeneric>
        : SnapshotTestCaseMultiInput<FunctionToTestGeneric>;

export function itSnapshots<FunctionToTestGeneric extends AnyFunction>(
    functionToTestInput: FunctionToTestGeneric extends TypedFunction<any, infer ReturnValue>
        ? RequireNonVoid<ReturnValue, FunctionToTestGeneric>
        : never,
    describeKey: string,
    snapshotCases: void extends ReturnType<FunctionToTestGeneric>
        ? 'functionToTest must return something so its output can be tested.'
        : ReadonlyArray<SnapshotTestCase<FunctionToTestGeneric>>,
    options?: Pick<
        CompareExpectationsOptions<any>,
        'cwd' | 'noOverwriteWhenDifferent' | 'showFullError' | 'expectationFile'
    >,
): void;
export function itSnapshots<FunctionToTestGeneric extends AnyFunction>(
    functionToTestInput: FunctionToTestGeneric extends TypedFunction<any, infer ReturnValue>
        ? RequireNonVoid<ReturnValue, FunctionToTestGeneric>
        : never,
    snapshotCases: void extends ReturnType<FunctionToTestGeneric>
        ? 'functionToTest must return something so its output can be tested.'
        : ReadonlyArray<SnapshotTestCase<FunctionToTestGeneric>>,
    options?: Pick<
        CompareExpectationsOptions<any>,
        'cwd' | 'noOverwriteWhenDifferent' | 'showFullError' | 'expectationFile'
    >,
): void;
export function itSnapshots<FunctionToTestGeneric extends AnyFunction>(
    functionToTestInput: FunctionToTestGeneric extends TypedFunction<any, infer ReturnValue>
        ? RequireNonVoid<ReturnValue, FunctionToTestGeneric>
        : never,
    describeKeyOrSnapshotCases:
        | string
        | (void extends ReturnType<FunctionToTestGeneric>
              ? 'functionToTest must return something so its output can be tested.'
              : ReadonlyArray<SnapshotTestCase<FunctionToTestGeneric>>),
    snapshotCasesOrOptions:
        | (void extends ReturnType<FunctionToTestGeneric>
              ? 'functionToTest must return something so its output can be tested.'
              : ReadonlyArray<SnapshotTestCase<FunctionToTestGeneric>>)
        | Pick<
              CompareExpectationsOptions<any>,
              'cwd' | 'noOverwriteWhenDifferent' | 'showFullError' | 'expectationFile'
          > = {},
    options: Pick<
        CompareExpectationsOptions<any>,
        'cwd' | 'noOverwriteWhenDifferent' | 'showFullError' | 'expectationFile'
    > = {},
): void {
    assertRuntimeTypeOf(functionToTestInput, 'function', 'functionToTest input');
    const functionToTest = functionToTestInput as AnyFunction;
    const snapshotCases =
        typeof describeKeyOrSnapshotCases === 'string'
            ? snapshotCasesOrOptions
            : describeKeyOrSnapshotCases;
    const describeKey =
        typeof describeKeyOrSnapshotCases === 'string'
            ? describeKeyOrSnapshotCases
            : functionToTest.name;

    if (!describeKey) {
        throw new Error(
            `Received empty describe key. You either passed an empty describeKey string or your function is anonymous (has no name). Either explicitly provide a describeKey (as the second input to this function) or used a named function as the first input (rather than an anonymous one).`,
        );
    }

    assertRuntimeTypeOf(snapshotCases, 'array', 'snapshotCases input');

    snapshotCases.reduce((previousPromises, snapshotCase) => {
        const newDeferredPromise = createDeferredPromiseWrapper<void>();
        const currentPromises = [
            ...previousPromises,
            newDeferredPromise.promise,
        ];
        // add an empty error handler to prevent extraneous errors
        // cannot test for it cases that fail
        // istanbul ignore next
        newDeferredPromise.promise.catch(() => null);
        it(snapshotCase.it, async () => {
            try {
                await Promise.all(previousPromises);
            } catch (error) {
                // ignore this error so that all tests try to run
            }
            try {
                const inputs: Parameters<FunctionToTestGeneric> =
                    'input' in snapshotCase
                        ? ([snapshotCase.input] as Parameters<FunctionToTestGeneric>)
                        : 'inputs' in snapshotCase
                        ? snapshotCase.inputs
                        : ([] as unknown as Parameters<FunctionToTestGeneric>);
                await assertExpectedOutput(
                    functionToTest,
                    {
                        key: {
                            topKey: describeKey,
                            subKey: snapshotCase.it,
                        },
                        ...options,
                    },
                    ...inputs,
                );
                newDeferredPromise.resolve();
            } catch (error) {
                // cannot test for it cases that fail
                // istanbul ignore next
                newDeferredPromise.reject(error);
                // istanbul ignore next
                throw error;
            }
        });

        return currentPromises;
    }, [] as ReadonlyArray<Promise<void>>);
}
