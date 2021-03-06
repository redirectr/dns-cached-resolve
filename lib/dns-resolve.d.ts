/// <reference types="node" />
import dns from 'dns';
import { Options as RetryOptions } from 'async-retry';
declare type Options = {
    ipv6?: boolean;
    minimumCacheTime?: number;
    refreshCache?: boolean;
    retryOpts?: RetryOptions;
    resolver?: typeof dns;
    txt?: boolean;
};
export default function dnsResolve(host: string, options?: Options): Promise<any>;
export declare function setupCache(): void;
export {};
