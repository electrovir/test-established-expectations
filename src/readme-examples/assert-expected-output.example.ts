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
        });
    });
});
