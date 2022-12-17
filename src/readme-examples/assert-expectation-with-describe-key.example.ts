import {describe, it} from 'mocha';
import {assertExpectation} from '..';

function myFunctionToTest() {
    return 'dummy function';
}

describe(myFunctionToTest.name, () => {
    it('should match expected output', async () => {
        const result = myFunctionToTest();

        await assertExpectation({
            key: {
                // the topKey here extracts the function name manually
                topKey: {describe: myFunctionToTest.name},
                subKey: 'basic expectation',
            },
            result,
        });
    });
});
