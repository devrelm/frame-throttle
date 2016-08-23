const tapeTest = require('tape-catch');

module.exports.test = (description, test, final) => {
    tapeTest(description, (t) => {
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
