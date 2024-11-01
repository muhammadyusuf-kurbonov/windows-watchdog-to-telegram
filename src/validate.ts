import { Buffer } from "node:buffer";
import crypto from 'node:crypto';
import { isAfter } from 'date-fns';
import console from "node:console";

const publicKey = `
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqMcAOn5enm/mwStx/60n
D+51YzW7rj5JYwDEd9QSFKTqXF1tG/pdmXFB4D1kY0/ods7R6GX6XdMuf2znrGbI
5fOsEhMQNfQVwQtSwFRC0Q0d6BnoA2drN/rb9jDhvwpcJ116bUxR/NMXu0mK84TH
GyrG+w4I52wv1yqtoDXTl+F6Mnns2NWiqEoEBmDOJyOPR4L5zZA1/F2JOdi5ghSk
bRx+Opyq++Y6j2+6xvRGUPqfH5mbAo4MqVNZK/whU0ID63ReS0rfZ70lVNX+8WxS
i7U4ipCQIyHnhKQYDimvl0Mg2aFIuJXi6ByvaY3/AL9sOTgBi4PEJKm/wXQpXgRN
GQIDAQAB
-----END PUBLIC KEY-----
`;

export function checkExpire(licenseKey: string): boolean {
    const key = Buffer.from(licenseKey, 'base64');
    const [date, signature] = key.toString().split('|');

    if (!date || !signature) {
        throw new Error('Invalid license key.');
    }

    if (!validateSignature(signature)) {
        throw new Error('Invalid license key.');
    }

    const expireDate = new Date(parseInt(date));
    console.log(`License key expires on ${expireDate}`, date);
    return isAfter(expireDate, new Date());
}

export function validateSignature(key: string) {
  const verifier = crypto.createVerify("RSA-SHA256");

  const publicKeyBuf = Buffer.from(publicKey);
  const signatureBuf = Buffer.from(key, "base64");
  verifier.update('Muhammadyusuf Kurbonov');

  const result = verifier.verify(publicKeyBuf, signatureBuf);

  return result;
}
