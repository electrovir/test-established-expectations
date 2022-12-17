import {describe, it} from 'mocha';
import {assertExpectedOutput} from '..';

function myFunctionToTest() {
    return 'dummy function';
}

describe(myFunctionToTest.name, () => {
    it('should match expected output', async () => {
        await assertExpectedOutput(myFunctionToTest, {
            key: {
                subKey: 'basic expectation',
            },
            // prevent overwriting the stored expectations when this expectation fails
            noOverwriteWhenDifferent: true,
        });
    });
});
