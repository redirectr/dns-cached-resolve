"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dns_1 = __importDefault(require("dns"));
const lru_cache_1 = __importDefault(require("lru-cache"));
const async_retry_1 = __importDefault(require("async-retry"));
const resolve4_1 = __importDefault(require("./resolve4"));
const resolve6_1 = __importDefault(require("./resolve6"));
const resolveTxt_1 = __importDefault(require("./resolveTxt"));
const lruOptions = { max: 500 };
let cache4;
let cache6;
let cacheTxt;
class DNSError extends Error {
    constructor(code, hostname) {
        super(`queryA ${code} ${hostname}`);
        this.code = code;
        this.hostname = hostname;
    }
}
setupCache();
async function dnsResolve(host, options = {}) {
    return options.txt
        ? dnsResolveTxt(host, options)
        : dnsResolveNonTxt(host, options);
}
exports.default = dnsResolve;
async function dnsResolveNonTxt(host, options = {}) {
    const { ipv6 = false, minimumCacheTime = 300, refreshCache = false, retryOpts = { minTimeout: 10, retries: 3, factor: 5 }, resolver = dns_1.default } = options;
    const { cache, resolve } = ipv6
        ? { cache: cache6, resolve: resolve6_1.default }
        : { cache: cache4, resolve: resolve4_1.default };
    if (refreshCache) {
        cache.del(host);
    }
    else {
        const ip = cache.get(host);
        if (ip)
            return await ip;
    }
    const p = (async () => {
        const res = await async_retry_1.default(() => resolve(host, resolver), retryOpts);
        const rec = res[Math.floor(Math.random() * res.length)];
        if (!rec) {
            throw new DNSError('ENOTFOUND', host);
        }
        const ttl = Math.max(rec.ttl, minimumCacheTime);
        cache.set(host, rec.address, ttl * 1000);
        return rec.address;
    })();
    cache.set(host, p, 5000);
    return p;
}
async function dnsResolveTxt(host, options = {}) {
    const { refreshCache = false, retryOpts = { minTimeout: 10, retries: 3, factor: 5 }, resolver = dns_1.default } = options;
    if (refreshCache) {
        cacheTxt.del(host);
    }
    else {
        const records = cacheTxt.get(host);
        if (records)
            return JSON.parse(await records);
    }
    const p = (async () => {
        const res = await async_retry_1.default(() => resolveTxt_1.default(host, resolver), retryOpts);
        const resString = JSON.stringify(res);
        cacheTxt.set(host, resString, 300 * 1000);
        return resString;
    })();
    cacheTxt.set(host, p, 5000);
    return JSON.parse(await p);
}
function setupCache() {
    cache4 = new lru_cache_1.default(lruOptions);
    cache6 = new lru_cache_1.default(lruOptions);
    cacheTxt = new lru_cache_1.default(lruOptions);
}
exports.setupCache = setupCache;
