import {JsonValue} from 'type-fest';
import {ExpectationKeys} from './expectation-key';

export type CompareExpectationsOptions<ResultGeneric extends JsonValue = JsonValue> = {
    key: Readonly<ExpectationKeys>;
    result: Readonly<ResultGeneric>;
    expectationFile?: string;
    cwd?: string;
    noOverwriteWhenDifferent?: boolean;
};
