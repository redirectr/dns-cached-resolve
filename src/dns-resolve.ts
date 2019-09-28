import dns from 'dns';
import LRU, { Options as LRUOptions, Cache } from 'lru-cache';
import retry, { Options as RetryOptions } from 'async-retry';
import resolve4 from './resolve4';
import resolve6 from './resolve6';
import resolveTxt from './resolveTxt';

const lruOptions = { max: 500 };
let cache4: Cache<string, string | Promise<string>>;
let cache6: Cache<string, string | Promise<string>>;
let cacheTxt: Cache<string, string | Promise<string>>;

type Options = {
  ipv6?: boolean;
  minimumCacheTime?: number;
  refreshCache?: boolean;
  retryOpts?: RetryOptions;
  resolver?: typeof dns;
  txt?: boolean;
};

class DNSError extends Error {
    code: string;
    hostname: string;

    constructor(code: string, hostname: string) {
        super(`queryA ${code} ${hostname}`);
        this.code = code;
        this.hostname = hostname;
    }
}

setupCache();

export default async function dnsResolve(host: string, options: Options = {}) {
  return options.txt
    ? dnsResolveTxt(host, options)
    : dnsResolveNonTxt(host, options);
}

async function dnsResolveNonTxt(host: string, options: Options = {}) {
  const {
    ipv6 = false,
    minimumCacheTime = 300,
    refreshCache = false,
    retryOpts = { minTimeout: 10, retries: 3, factor: 5 },
    resolver = dns
  } = options;

  const { cache, resolve } = ipv6
    ? { cache: cache6, resolve: resolve6 }
    : { cache: cache4, resolve: resolve4 };

  if (refreshCache) {
    cache.del(host);
  } else {
    const ip = cache.get(host);
    if (ip) return await ip;
  }

  const p = (async () => {
    const res = await retry(() => resolve(host, resolver), retryOpts);
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

async function dnsResolveTxt(host: string, options: Options = {}) {
  const {
    refreshCache = false,
    retryOpts = { minTimeout: 10, retries: 3, factor: 5 },
    resolver = dns
  } = options;

  if (refreshCache) {
    cacheTxt.del(host);
  } else {
    const records = cacheTxt.get(host);
    if (records) return JSON.parse(await records);
  }

  const p = (async () => {
    const res = await retry(() => resolveTxt(host, resolver), retryOpts);
    const resString = JSON.stringify(res)
    cacheTxt.set(host, resString, 300 * 1000);
    return resString;
  })();

  cacheTxt.set(host, p, 5000);
  return JSON.parse(await p);
}

export function setupCache() {
  cache4 = new LRU(lruOptions);
  cache6 = new LRU(lruOptions);
  cacheTxt = new LRU(lruOptions);
}
