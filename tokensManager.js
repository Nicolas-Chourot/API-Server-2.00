
import * as utilities from './utilities.js';
import Repository from './models/repository.js';
import Token from './models/token.js';
import * as ServerVariables from "./serverVariables.js";
import {log} from "./log.js";

global.tokensRepository = new Repository(new Token());

global.tokenLifeDuration = ServerVariables.get("main.token.lifeDuration");

export default
class TokensManager {
    static create(user) {
        let token = Token.create(user);
        token.Expire_Time = utilities.nowInSeconds() + tokenLifeDuration;
        tokensRepository.add(token);
        console.log("User " + token.Username + " logged in");
        return token;
    }
    static logout(userId) {
        let tokens = tokensRepository.getAll();
        let index = 0;
        let indexToDelete = [];
        for (let token of tokens) {
            if (token.UserId == userId) {
                indexToDelete.push(index);
                console.log("User " + token.Username + " logged out");
            }
            index++;
        }
        tokensRepository.removeByIndex(indexToDelete);
    }
    static clean() {
        let tokens = tokensRepository.getAll();
        let now = utilities.nowInSeconds();
        let index = 0;
        let indexToDelete = [];
        for (let token of tokens) {
            if (token.Expire_Time < now) {
                indexToDelete.push(index);
                console.log("Access token of user " + token.Username + " expired");
            }
            index++;
        }
        if (index > 0)
            tokensRepository.removeByIndex(indexToDelete);
    }
    static find(access_token) {
        let token = tokensRepository.findByField('Access_token', access_token);
        if (token != null) {
            // renew expiration date
            token.Expire_Time = utilities.nowInSeconds() + tokenLifeDuration;
            tokensRepository.update(token.Id, token);
            return token;
        }
        return null;
    }
    static requestAuthorized(req) {
        if (req.headers["authorization"] != undefined) {
            // Extract bearer token from head of the http request
            let token = req.headers["authorization"].replace('Bearer ', '');
            return (this.find(token) != null);
        }
        return false;
    }
    static getToken(req) {
        if (req.headers["authorization"] != undefined) {
            // Extract bearer token from head of the http request
            let token = req.headers["authorization"].replace('Bearer ', '');
            return this.find(token);
        }
        return null;
    }

}

// periodic cleaning of expired tokens
log(BgWhite, FgBlack,"Periodic tokens repository cleaning process started...");
setInterval(TokensManager.clean, tokenLifeDuration * 1000);
