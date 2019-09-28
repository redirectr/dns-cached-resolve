/// <reference types="node" />
import dns from 'dns';
export default function resolveTxt(host: string, resolver: typeof dns): Promise<Array<Array<string>>>;
