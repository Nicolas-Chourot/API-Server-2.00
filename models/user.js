import Model from './model.js';

export default class User extends Model {
    constructor()
    {
        super();
        this.addField('Name', 'string');
        this.addField('Email', 'email');        
        this.addField('Password', 'string');
        this.addField('Avatar', 'asset');
        this.addField('Created','integer');
        this.addField('VerifyCode','string');

        this.setKey("Email");
    }
}