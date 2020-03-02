/**
 * Used to join the values of multiple css-classes (due to css-module)
 * @param str
 */
import {Component} from 'preact';

export function joinStrings(...str: Array<string>): string {
    return str.join(' ');
}


/**
 * A decorator which binds a function to the class instance.
 * Taken from https://github.com/GoogleChromeLabs/squoosh/blob/master/src/lib/initial-util.ts#L16
 * @param target
 * @param propertyKey
 * @param descriptor
 */
export function bind(target: Component, propertyKey: string, descriptor: PropertyDescriptor) {
    return {
        // the first time the prototype property is accessed for an instance,
        // define an instance property pointing to the bound function.
        // This effectively "caches" the bound prototype method as an instance property.
        get() {
            const bound = descriptor.value.bind(this);

            Object.defineProperty(this, propertyKey, {
                value: bound
            });

            return bound;
        }
    };
}
