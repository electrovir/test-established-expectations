import {assertThrows} from 'run-time-assertions';
import {itSnapshots} from './it-snapshots';

describe(itSnapshots.name, () => {
    it('should have correct types', () => {
        // @ts-expect-error the test function must return something
        itSnapshots(() => {}, 'describeKey', [] as any[]);

        assertThrows(() =>
            itSnapshots(
                () => {
                    console.log('elo?');
                    return 5;
                },
                '',
                [
                    {
                        it: 'should do a thing',
                    },
                ],
            ),
        );

        itSnapshots(
            () => {
                console.log('elo?');
                return 5;
            },
            'group key',
            [
                {
                    it: 'should do a thing',
                },
            ],
        );
        itSnapshots(
            (b: number) => {
                return 5 + b;
            },
            'group key',
            [
                {
                    it: 'should do a thing',
                    input: 32,
                },
            ],
        );

        function namedFunction(b: number) {
            return 5 + b;
        }
        itSnapshots(namedFunction, [
            {
                it: 'should do a thing',
                input: 32,
            },
        ]);
    });

    itSnapshots(
        (a: number) => {
            return 10 + a;
        },
        'itSnapshots',
        [
            {
                it: 'works with a single input',
                input: 42,
            },
        ],
    );

    itSnapshots(
        (a: string, b: number) => {
            return [
                a,
                b,
            ].join(',');
        },
        'itSnapshots',
        [
            {
                it: 'works with multiple inputs',
                inputs: [
                    'a',
                    42,
                ],
            },
        ],
    );

    itSnapshots(
        () => {
            return 'worked';
        },
        'itSnapshots',
        [
            {
                it: 'works with no inputs',
            },
        ],
    );
});
