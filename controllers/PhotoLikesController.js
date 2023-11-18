import Authorizations from '../authorizations.js';
import Repository from '../models/repository.js';
import PhotoLikeModel from '../models/photoLike.js';
import PhotoModel from '../models/photo.js';
import Controller from './Controller.js';

export default
    class PhotoLikes extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new PhotoLikeModel()), Authorizations.user());
    }
    addLikeToPhoto(id, amount) {
        let photoRepository = new Repository(new PhotoModel());
        let photo = photoRepository.get(id);
        photo.Likes += amount;
        photoRepository.update(photo.Id, photo);
    }
    get() {
        let PhotoId = this.HttpContext.path.params.PhotoId;
        let UserId = this.HttpContext.path.params.UserId;
        let likes = this.repository.getAll({PhotoId, UserId});
        if (likes.length > 0) {
            super.get(likes[0].Id);
        } else
            this.HttpContext.response.notFound();
    }
    post(data) {
        let like = super.post(data);
        this.addLikeToPhoto(like.PhotoId, 1);
    }
    remove(data) {
        let likes = this.repository.getAll({PhotoId: data.PhotoId, UserId: data.UserId});
        if (likes.length > 0) {
            this.addLikeToPhoto(likes[0].PhotoId, -1);
            super.remove(likes[0].Id);
        } else {
            this.HttpContext.response.badRequest('Like does not exist');
        }
    }
}