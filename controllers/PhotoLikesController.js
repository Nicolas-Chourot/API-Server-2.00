import Authorizations from '../authorizations.js';
import Repository from '../models/repository.js';
import PhotoLikeModel from '../models/photoLike.js';
import PhotoModel from '../models/photo.js';
import Controller from './Controller.js';
import * as utilities from "../utilities.js";

export default
    class PhotoLikes extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new PhotoLikeModel()), Authorizations.user());
    }
    addLikeToPhoto(id, amount) {
        let photoRepository = new Repository(new PhotoModel());
        let photo = photoRepository.findByField("Id", id);
        photo.Likes += amount;
        photoRepository.update(photo.Id, photo);
    }
    find(PhotoId, UserId) {
        let likes = this.repository.getAll({ PhotoId, UserId }, true);
        if (likes.length > 0) return likes[0];
        return null;
    }
    get() {
        let PhotoId = this.HttpContext.path.params.PhotoId;
        let UserId = this.HttpContext.path.params.UserId;
        if (UserId) {
            let like = this.repository.getAll({ PhotoId, UserId });
            if (like.length > 0) {
                super.get(like[0].Id);
            } else
                this.HttpContext.response.notFound();
        } else {
            if (PhotoId) {
                this.HttpContext.response.JSON(this.repository.getAll({PhotoId}));
            } else
                super.get();
        }
    }
    post(data) {
        let likeFound = this.find(data.PhotoId, data.UserId);
        if (!likeFound) {
            data.Date = utilities.nowInSeconds();
            this.addLikeToPhoto(data.PhotoId, 1);
            super.post(data);
        } else {
            this.removeLike(data);
        }
    }
    removeLike(data) {
        let like = this.find(data.PhotoId, data.UserId);
        if (like) {
            this.addLikeToPhoto(like.PhotoId, -1);
            super.remove(like.Id);
        } else {
            this.HttpContext.response.badRequest('Like does not exist');
        }
    }
}