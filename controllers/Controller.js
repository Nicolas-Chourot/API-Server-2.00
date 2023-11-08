import TokenManager from '../tokensManager.js';

export default class Controller {
    constructor(HttpContext, repository = null, needReadAuthorization = false, needWriteAuthorization = true) {
        this.needReadAuthorization = needReadAuthorization;
        this.needWriteAuthorization = needWriteAuthorization;
        this.HttpContext = HttpContext;
        this.repository = repository;
    }
    readAuthorization() {
        if (this.needReadAuthorization)
            return TokenManager.requestAuthorized(this.HttpContext.req)
        return true
    }
    writeAuthorization() {
        if (this.needWriteAuthorization)
            return TokenManager.requestAuthorized(this.HttpContext.req)
        return true;
    }
    head() {
        if (this.repository != null) {
            this.HttpContext.response.ETag(this.repository.ETag);
        } else
            this.HttpContext.response.notImplemented();
    }
    get(id) {
        if (this.readAuthorization()) {
            if (this.repository != null) {
                if (id !== undefined) {
                    if (!isNaN(id)) {
                        let data = this.repository.get(id);
                        if (data != null)
                            this.HttpContext.response.JSON(data);
                        else
                            this.HttpContext.response.notFound("Ressource not found.");
                    } else
                        this.HttpContext.response.badRequest("The Id in the request url is rather not specified or syntactically wrong.");
                } else
                    this.HttpContext.response.JSON(this.repository.getAll(this.HttpContext.path.params), this.repository.ETag, true, this.needReadAuthorization);
            } else
                this.HttpContext.response.notImplemented();
        } else
            this.HttpContext.response.unAuthorized();
    }
    post(data) {
        if (this.writeAuthorization()) {
            if (this.repository != null) {
                data = this.repository.add(data);
                if (this.repository.model.state.isValid) {
                    this.HttpContext.response.created(data);
                } else {
                    if (this.repository.model.state.inConflict)
                        this.HttpContext.response.conflict(this.repository.model.state.errors);
                    else
                        this.HttpContext.response.badRequest(this.repository.model.state.errors);
                }
            } else
                this.HttpContext.response.notImplemented();
        } else
            this.HttpContext.response.unAuthorized();
    }
    put(data) {
        if (this.writeAuthorization()) {
            if (this.repository != null) {
                if (!isNaN(this.HttpContext.path.id)) {
                    this.repository.update(this.HttpContext.path.id, data);
                    if (this.repository.model.state.isValid) {
                        this.HttpContext.response.ok();
                    } else {
                        if (this.repository.model.state.notFound) {
                            this.HttpContext.response.notFound(this.repository.model.state.errors);
                        } else {
                            if (this.repository.model.state.inConflict)
                                this.HttpContext.response.conflict(this.repository.model.state.errors)
                            else
                                this.HttpContext.response.badRequest(this.repository.model.state.errors);
                        }
                    }
                } else
                    this.HttpContext.response.badRequest("The Id of ressource is not specified in the request url.")
            } else
                this.HttpContext.response.notImplemented();
        } else
            this.HttpContext.response.unAuthorized();
    }
    remove(id) {
        if (this.writeAuthorization()) {
            if (this.repository != null) {
                if (!isNaN(this.HttpContext.path.id)) {
                    if (this.repository.remove(id))
                        this.HttpContext.response.accepted();
                    else
                        this.HttpContext.response.notFound("Ressource not found.");
                } else
                    this.HttpContext.response.badRequest("The Id in the request url is rather not specified or syntactically wrong.");
            } else
                this.HttpContext.response.notImplemented();
        } else
            this.HttpContext.response.unAuthorized();
    }
}
