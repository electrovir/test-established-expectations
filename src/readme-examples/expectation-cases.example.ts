import {expectationCases} from '..';

function myFunctionToTest(input1: string, input2: number) {
    return `${input1}-${input2}`;
}

describe(myFunctionToTest.name, () => {
    expectationCases(myFunctionToTest, [
        {
            it: 'should combine inputs',
            inputs: [
                'first input',
                2,
            ],
        },
        {
            it: 'should combine different inputs',
            inputs: [
                'one',
                22,
            ],
        },
    ]);

    // optionally pass an options parameter as the second parameter
    expectationCases(
        myFunctionToTest,
        {
            // if the given function to test is anonymous, this testKey must be provided
            testKey: 'topKey',
            cwd: 'my/path',
            expectationFile: 'my-expectation-file.json',
        },
        [
            {
                it: 'should combine different inputs with options',
                inputs: [
                    'more',
                    -1,
                ],
            },
        ],
    );
});
