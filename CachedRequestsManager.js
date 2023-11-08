
import * as utilities from './utilities.js';
import TokenManager from './tokensManager.js';
import * as serverVariables from "./serverVariables.js";
import { log } from "./log.js";
global.requestCacheExpirationTime = serverVariables.get("main.requestCache.expirationTime");

// Get requests cache
global.CachedRequests = [];

export default class CachedRequestsManager {
    static add(url, content, ETag = "", readAuthorization = false) {
        if (url != "") {
            CachedRequests.push({ url, content, ETag, readAuthorization, Expire_Time: utilities.nowInSeconds() + requestCacheExpirationTime });
            log(BgCyan, FgWhite, "Response content of request Get: ", url, " added in requests cache");
        }
    }
    static find(url) {
        try {
            if (url != "") {
                for (let endpoint of CachedRequests) {
                    if (endpoint.url == url) {
                        // renew cached url
                        endpoint.Expire_Time = utilities.nowInSeconds() + requestCacheExpirationTime;
                        log(BgGreen, FgWhite, "Response content of request Get: ", url, " retreived from requests cache");
                        let content = endpoint.content;
                        let ETag = endpoint.ETag;
                        return { ETag, content };
                    }
                }
            }
        } catch (error) {
            console.log("requests cache error", error);
        }
        return null;
    }
    static clear(url) {
        if (url != "")
            CachedRequests = CachedRequests.filter(endpoint => endpoint.url.toLowerCase().indexOf(url.toLowerCase()) == -1);
    }
    static flushExpired() {
        let now = utilities.nowInSeconds();
        for (let endpoint of CachedRequests) {
            if (endpoint.Expire_Time < now)
                log(BgYellow, FgBlack, "Cached response of request GET:", endpoint.url + " expired");
        }
        CachedRequests = CachedRequests.filter(endpoint => endpoint.Expire_Time > now);
    }
    static readAuthorization(readAuthorization, HttpContext) {
        if (readAuthorization)
            return TokenManager.requestAuthorized(HttpContext.req)
        return true
    }
    static get(HttpContext) {
        if (HttpContext.req.method == 'GET') {
            let cacheFound = CachedRequestsManager.find(HttpContext.req.url);
            if (cacheFound != null) {
                if (CachedRequestsManager.readAuthorization(cacheFound.readAuthorization, HttpContext)) {
                    HttpContext.response.JSON(cacheFound.content, cacheFound.ETag, true);
                    return true;
                }
            }
        }
        return false;
    }
}

// periodic cleaning of expired cached requests
setInterval(CachedRequestsManager.flushExpired, requestCacheExpirationTime * 1000);
log(BgWhite, FgBlack, "Periodic cached requests cleaning process started...");
