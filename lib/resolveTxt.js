"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function resolveTxt(host, resolver) {
    return new Promise((resolve, reject) => {
        resolver.resolveTxt(host, (err, res) => {
            if (err)
                return reject(err);
            resolve(res);
        });
    });
}
exports.default = resolveTxt;
