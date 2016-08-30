/// <reference path="../../typings/tsd.d.ts" />
import * as tape from 'tape-catch';

export const test = (description, test, final) => {
    tape(description, (t) => {
        let error;
        try {
            test(t);
        } catch (e) {
            error = e;
        } finally {
            try {
                if (final) final();
            } finally {
                if (error) throw error;
            }
        }
    });
};
