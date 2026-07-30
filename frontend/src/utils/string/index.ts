/**
 * Capitalizes the first letter of a string.
 *
 * @param str - The string to capitalize.
 * @returns The capitalized string.
 *
 * @example
 * capitalize('hello') // returns 'Hello'
 * capitalize('world') // returns 'World'
 * capitalize('') // returns ''
 * capitalize(null) // returns ''
 */
const capitalize = <T extends string>(str: T): Capitalize<T> => {
    return (str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<T>;
};

const string = {
    capitalize,
};

export default string;
