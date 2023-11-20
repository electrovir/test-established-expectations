import {describe, it} from 'mocha';
import {assertTypeOf} from 'run-time-assertions';
import {CompareExpectationsOptions} from './expectation-options';

describe('CompareExpectationsOptions', () => {
    const baseExampleInstance = {
        key: {
            subKey: '',
            topKey: '',
        },
        result: 4,
    } as const;

    it('has proper props', () => {
        assertTypeOf({
            ...baseExampleInstance,
            cwd: '',
            expectationFile: '',
            noOverwriteWhenDifferent: false,
        }).toBeAssignableTo<CompareExpectationsOptions<number>>();
    });

    it('has proper optional props', () => {
        assertTypeOf(baseExampleInstance).toBeAssignableTo<CompareExpectationsOptions<number>>();
    });

    it('restricts the result type', () => {
        assertTypeOf(baseExampleInstance).not.toBeAssignableTo<
            CompareExpectationsOptions<string>
        >();
    });
});
