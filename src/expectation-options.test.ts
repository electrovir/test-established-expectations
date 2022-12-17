import {assertTypeOf} from '@augment-vir/chai';
import {describe, it} from 'mocha';
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
        }).toBeAssignableTo<CompareExpectationsOptions>();
    });

    it('has proper optional props', () => {
        assertTypeOf(baseExampleInstance).toBeAssignableTo<CompareExpectationsOptions>();
    });

    it('restricts the result type', () => {
        assertTypeOf(baseExampleInstance).not.toBeAssignableTo<
            CompareExpectationsOptions<string>
        >();
    });
});
