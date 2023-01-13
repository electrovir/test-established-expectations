import type {JsonValue} from 'type-fest';
import type {ExpectationKeys} from './expectation-key';

export type CompareExpectationsOptions<ResultGeneric extends JsonValue = JsonValue> = {
    key: Readonly<ExpectationKeys>;
    result: Readonly<ResultGeneric>;
    expectationFile?: string;
    cwd?: string;
    /**
     * When set to true, expectations within the expectation file will not be overwritten when they
     * are not matched; an error will simply be thrown. When this is set to true, it may be harder
     * to debug expectation failures. Consider setting "showFullError" to true in that case.
     *
     * By default this is false, and the expectation file will always be overwritten.
     */
    noOverwriteWhenDifferent?: boolean;
    /**
     * Set this to true in order to throw the full expectation mismatch error. This will often cause
     * test output to become very noisy, but it is necessary in order to see failures if
     * "noOverwriteWhenDifferent" is set to true.
     *
     * By default this is false, and the full mismatch will not be shown.
     */
    showFullError?: boolean;
};
