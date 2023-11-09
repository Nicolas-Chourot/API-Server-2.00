import UserModel from '../models/user.js';
import Repository from '../models/repository.js';
import TokenManager from '../tokensManager.js';
import * as utilities from "../utilities.js";
import Gmail from "../gmail.js";
import Controller from './Controller.js';
import Authorizations from '../authorizations.js';

export default class AccountsController extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new UserModel()), Authorizations.admin());
    }
    index(id) {
        if (!isNaN(id)) {
            if (Authorizations.granted(this.HttpContext, Authorizations.admin()))
                this.HttpContext.response.JSON(this.repository.get(id));
            else
                this.HttpContext.response.unAuthorized();
        }
        else {
            if (Authorizations.granted(this.HttpContext, Authorizations.admin()))
                this.HttpContext.response.JSON(this.repository.getAll(this.HttpContext.path.params), this.repository.ETag, true, Authorizations.admin());
            else
                this.HttpContext.response.unAuthorized();
        }
    }
    // POST: /token body payload[{"Email": "...", "Password": "..."}]
    login(loginInfo) {
        if (loginInfo) {
            if (this.repository != null) {
                let user = this.repository.findByField("Email", loginInfo.Email);
                if (user != null) {
                    if (user.Password == loginInfo.Password) {
                        let newToken = TokenManager.create(user);
                        this.HttpContext.response.JSON(newToken);
                    } else {
                        this.HttpContext.response.wrongPassword();
                    }
                } else
                    this.HttpContext.response.userNotFound("This user email is not found.");
            } else
                this.HttpContext.response.notImplemented();
        } else
            this.HttpContext.response.badRequest("Credential Email and password are missing.");
    }
    logout(userId) {
        TokenManager.logout(userId);
        this.HttpContext.response.accepted();
    }

    sendVerificationEmail(user) {
        let html = `
                Bonjour ${user.Name}, <br /> <br />
                Voici votre code pour confirmer votre adresse de courriel
                <br />
                <h3>${user.VerifyCode}</h3>
            `;
        const gmail = new Gmail();
        gmail.send(user.Email, 'Vérification de courriel...', html);
    }

    sendConfirmedEmail(user) {
        let html = `
                Bonjour ${user.Name}, <br /> <br />
                Votre courriel a été confirmé.
            `;
        const gmail = new Gmail();
        gmail.send(user.Email, 'Courriel confirmé...', html);
    }

    //GET : /accounts/verify?id=...&code=.....
    verify() {
        if (this.repository != null) {
            let id = this.HttpContext.path.params.id;
            let code = parseInt(this.HttpContext.path.params.code);
            let userFound = this.repository.findByField('Id', id);
            if (userFound) {
                if (userFound.VerifyCode == code) {
                    userFound.VerifyCode = "verified";
                    this.repository.update(userFound.Id, userFound);
                    if (this.repository.model.state.isValid) {
                        this.HttpContext.response.ok();
                        this.sendConfirmedEmail(userFound);
                    } else {
                        this.HttpContext.response.unprocessable();
                    }
                } else {
                    this.HttpContext.response.unverifiedUser();
                }
            } else {
                this.HttpContext.response.unprocessable();
            }
        } else
            this.HttpContext.response.notImplemented();
    }

    // POST: account/register body payload[{"Id": 0, "Name": "...", "Email": "...", "Password": "..."}]
    register(user) {
        if (this.repository != null) {
            user.Created = utilities.nowInSeconds();
            user.VerifyCode = utilities.makeVerifyCode(6);
            user.Authorizations = Authorizations.user();
            let newUser = this.repository.add(user);
            if (this.repository.model.state.isValid) {
                newUser.Password = "********";
                this.HttpContext.response.created(newUser);
                this.sendVerificationEmail(newUser);
            } else {
                if (this.repository.model.state.inConflict)
                    this.HttpContext.response.conflict(this.repository.model.state.errors);
                else
                    this.HttpContext.response.badRequest(this.repository.model.state.errors);
            }
        } else
            this.HttpContext.response.notImplemented();
    }
    // PUT:account/modify body payload[{"Id": 0, "Name": "...", "Email": "...", "Password": "..."}]
    modify(user) {
        if (Authorizations.granted(this.HttpContext, Authorizations.user())) {
            if (this.repository != null) {
                user.Created = utilities.nowInSeconds();
                let foundedUser = this.repository.findByField("Id", user.Id);
                if (foundedUser != null) {
                    user.VerifyCode = foundedUser.VerifyCode
                    if (user.Password == '') { // password not changed
                        user.Password = foundedUser.Password;
                    }
                    this.repository.update(user);
                    if (this.repository.model.state.isValid) {
                        this.HttpContext.response.ok();
                        if (user.Email != foundedUser.Email) {
                            user.VerifyCode = utilities.makeVerifyCode(6);
                            this.repository.update(user);
                            this.sendVerificationEmail(user);
                        }
                        // users have a link to imagesRepository
                        // let imagesRepository = new ImagesRepository();
                        // imagesRepository.newETag();
                    }
                    else {
                        if (this.repository.model.state.inConflict)
                            this.HttpContext.response.conflict(this.repository.model.state.errors);
                        else
                            this.HttpContext.response.badRequest(this.repository.model.state.errors);
                    }
                } else
                    this.HttpContext.response.notFound();
            } else
                this.HttpContext.response.notImplemented();
        } else
            this.HttpContext.response.unAuthorized();
    }
    // GET:account/remove/id
    remove(id) { // warning! this is not an API endpoint
        // this.deleteAllUsersImages(id)
        if (Authorizations.granted(this.HttpContext, Authorizations.user()))
            super.remove(id);
    }
    deleteAllUsersImages(userId) {
        let imagesRepository = new ImagesRepository(this.req, true);
        let images = imagesRepository.getAll();
        let indexToDelete = [];
        let index = 0;
        for (let image of images) {
            if (image.UserId == userId)
                indexToDelete.push(index);
            index++;
        }
        imagesRepository.removeByIndex(indexToDelete);
        imagesRepository.newETag();
    }

}