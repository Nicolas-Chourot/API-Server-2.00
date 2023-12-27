import Authorizations from '../authorizations.js';
import Repository from '../models/repository.js';
import PhotoModel from '../models/photo.js';
import PhotolikeModel from '../models/photolike.js';
import Controller from './Controller.js';

export default
    class Photos extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new PhotoModel()), Authorizations.user());
        this.photolikesRepository = new Repository(new PhotolikeModel());
    }

    put(photo) {
        let foundPhoto = this.repository.get(photo.Id);
        if (foundPhoto) 
            photo.OwnerId = foundPhoto.OwnerId;
        super.put(photo);
    }
    remove(photoId) {
        this.photolikesRepository.keepByFilter(like => like.PhotoId != photoId);
        super.remove(photoId);
    }
}