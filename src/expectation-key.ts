import {
    AnyFunction,
    getObjectTypedKeys,
    isLengthAtLeast,
    typedArrayIncludes,
    wrapNarrowTypeWithTypeCheck,
} from '@augment-vir/common';
import {UnionToIntersection} from 'type-fest';

export type TopKey = {function: AnyFunction} | {describe: string} | {context: string} | string;

export type ExpectationKeys<TopKeyGeneric extends TopKey = TopKey> = {
    topKey: TopKeyGeneric;
    subKey: string;
};

const accessorByProp = wrapNarrowTypeWithTypeCheck<
    Partial<{
        [Prop in keyof UnionToIntersection<Extract<ExpectationKeys['topKey'], object>>]: (
            key: Extract<ExpectationKeys['topKey'], Record<Prop, any>>,
        ) => string;
    }>
>()({
    function: (input) => {
        const functionName = input.function.name;

        if (functionName === 'function') {
            throw new Error(
                `Got expectation key function that doesn't have a name, or has the name "function". The "function" key cannot use anonymous functions, they must be named and they cannot be named "function".`,
            );
        }
        return functionName;
    },
} as const);

export function pickTopKeyFromExpectationKeys(keys: Pick<ExpectationKeys, 'topKey'>): string {
    const topKey = keys.topKey;
    if (typeof topKey === 'string') {
        return topKey;
    }

    const props = getObjectTypedKeys(topKey as UnionToIntersection<typeof topKey>);

    if (isLengthAtLeast(props, 2)) {
        throw new Error(
            `ExpectationKeys.key can only have one key but got "${props.length}": ${props.join(
                ', ',
            )}`,
        );
    }

    if (!isLengthAtLeast(props, 1)) {
        throw new Error(`ExpectationKeys.key needs a valid key type property.`);
    }

    const prop = props[0];

    if (typedArrayIncludes(getObjectTypedKeys(accessorByProp), prop)) {
        return accessorByProp[prop](
            topKey as Extract<ExpectationKeys['topKey'], Record<keyof typeof accessorByProp, any>>,
        );
    } else {
        return (
            topKey as UnionToIntersection<
                Exclude<typeof topKey, Record<keyof typeof accessorByProp, any>>
            >
        )[prop];
    }
}
