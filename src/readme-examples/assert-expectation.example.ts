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
                // the topKey here is a string
                topKey: 'my test',
                subKey: 'basic expectation',
            },
            result,
        });
    });
});
