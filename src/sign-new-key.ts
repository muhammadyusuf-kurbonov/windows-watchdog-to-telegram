import { addMonths } from 'date-fns';
import is_number from "is-number";
import { Buffer } from "node:buffer";
import console from "node:console";
import crypto from 'node:crypto';

function signText(text: string) {
  const privateKey = Deno.readFileSync("./private.key");

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(text);
  const signature = sign.sign(Buffer.from(privateKey), "base64");

  return btoa(text + '|' + signature);
}

let monthCount = 1;
const args = Deno.args;
if (args[0] && is_number(args[0])) {
  monthCount = parseInt(args[0]);
}

console.log(signText((addMonths(Date.now(), monthCount).getTime()).toString()));
