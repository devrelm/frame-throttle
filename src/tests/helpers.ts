/// <reference path="../../typings/tsd.d.ts" />
import * as tape from 'tape-catch';

export const test = (description: string, callback: tape.TestCase, final: () => void) => {
    tape(description, (assert) => {
        let error: any;
        try {
            callback(assert);
        } catch (e) {
            error = e;
        } finally {
            try {
                if (final) { final(); }
            } finally {
                if (error) { throw error; }
            }
        }
    });
};
