import dns from 'dns';

export default function resolveTxt(
  host: string,
  resolver: typeof dns
): Promise<Array<Array<string>>> {
  return new Promise((resolve, reject) => {
    resolver.resolveTxt(host, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}
