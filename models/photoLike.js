import Model from './model.js';
import UserModel from './user.js';
import Repository from '../models/repository.js';

export default class PhotoLike extends Model {
    constructor()
    {
        super();
        this.addField('PhotoId', 'string');
        this.addField('UserId', 'string');
        this.addField('Date','integer');
    }

    bindExtraData(instance) {
        instance = super.bindExtraData(instance);
        let usersRepository = new Repository(new UserModel());
        let user = usersRepository.get(instance.UserId);
        if (user) {
            instance.UserName = user.Name;
        }
        return instance;
    }
}