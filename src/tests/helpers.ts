/// <reference path="../../typings/tsd.d.ts" />
import * as tape from 'tape-catch';

export const test = (description, callback, final) => {
    tape(description, (assert) => {
        let error;
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
