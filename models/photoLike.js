import Model from './model.js';
import UserModel from './user.js';
import Repository from '../models/repository.js';

export default class Photo extends Model {
    constructor()
    {
        super();
        this.addField('PhotoId', 'string');
        this.addField('UseroId', 'string');
        this.addField('Date','integer');
    }

    bindExtraData(instance) {
        instance = super.bindExtraData(instance);
        let usersRepository = new Repository(new UserModel());
        let user = usersRepository.get(instance.UserId);
        instance.UserName = user.Name;
        delete instance.PhotoId;
        delete instance.UserId;
        return instance;
    }
}