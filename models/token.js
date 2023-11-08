import Model from './model.js';
import crypto from 'crypto';

export default class Token extends Model {
    constructor() {
        super();
        this.addField('Access_token', 'string');
        this.addField('UserId', 'integer');
        this.addField('Username', 'string');
    }
   static create(user = null) {
        let token = {};
        if (user) {
            token.Id = 0;
            token.Access_token = makeToken(user.Email);
            token.UserId = user.Id;
            token.Username = user.Name;
        }
        return token;
    }
}

function makeToken(text) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    function encrypt(text) {
        let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return {
            iv: iv.toString('hex'),
            encryptedData: encrypted.toString('hex')
        };
    }
    return encrypt(text).encryptedData;
}
