import {describe, it} from 'mocha';
import {assertExpectation} from '..';

function myFunctionToTest() {
    return 'dummy function';
}

describe(myFunctionToTest.name, () => {
    it('should match expected output with function as key', async () => {
        const result = myFunctionToTest();

        await assertExpectation({
            key: {
                topKey: {function: myFunctionToTest},
                subKey: 'basic expectation with function key',
            },
            result,
        });
    });
});
