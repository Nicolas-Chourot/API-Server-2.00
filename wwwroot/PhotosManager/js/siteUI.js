//<span class="cmdIcon fa-solid fa-ellipsis-vertical"></span>
let contentScrollPosition = 0;
let sortType = "date";
let keywords = "";
let loginMessage = "";
let Email = "";
let EmailError = "";
let passwordError = "";
let periodicRefreshPhotosListPeriod = 5; // seconds
let currentETag = "";
let currentViewName = "photosList";
let delayTimeOut = 2000; // seconds
let photoContainerWidth = 400;
let photoContainerHeight = 400;
let limit;
let HorizontalPhotosCount;
let VerticalPhotosCount;
let offset = 0;

Init_UI();
function Init_UI() {
    getViewPortPhotosRanges();
    initTimeout(delayTimeOut, renderExpiredSession);
    installWindowResizeHandler();
    if (API.retrieveLoggedUser())
        renderPhotos();
    else
        renderLoginForm();

    installPeriodicRefreshPhotosList();
}
function getViewPortPhotosRanges() {
    // estimate the value of limit according to height of content
    VerticalPhotosCount = Math.round($("#content").innerHeight() / photoContainerHeight);
    HorizontalPhotosCount = Math.round($("#content").innerWidth() / photoContainerWidth);
    limit = (VerticalPhotosCount + 1) * HorizontalPhotosCount;
    console.log("VerticalPhotosCount:", VerticalPhotosCount, "HorizontalPhotosCount:", HorizontalPhotosCount)
    offset = 0;
}
function installWindowResizeHandler() {
    var resizeTimer = null;
    var resizeEndTriggerDelai = 250;
    $(window).on('resize', function (e) {
        if (!resizeTimer) {
            $(window).trigger('resizestart');
        }
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            resizeTimer = null;
            $(window).trigger('resizeend');
        }, resizeEndTriggerDelai);
    }).on('resizestart', function () {
        console.log('resize start');
    }).on('resizeend', function () {
        console.log('resize end');
        if ($('#photosLayout') != null) {
            getViewPortPhotosRanges();
            if (currentViewName == "photosList")
                renderPhotosList();
        }
    });
}
function attachCmd() {
    $('#loginCmd').on('click', renderLoginForm);
    $('#logoutCmd').on('click', logout);
    $('#listPhotosCmd').on('click', renderPhotos);
    $('#listPhotosMenuCmd').on('click', renderPhotos);
    $('#editProfilMenuCmd').on('click', renderEditProfilForm);
    $('#renderManageUsersMenuCmd').on('click', renderManageUsers);
    $('#editProfilCmd').on('click', renderEditProfilForm);

    $('#sortByDate').on("click", () => { sortType = "date"; refreshHeader(); renderPhotos(); });
    $('#sortByOwners').on("click", () => { sortType = "owners"; refreshHeader(); renderPhotos(); });
    $('#sortByLikes').on("click", () => { sortType = "likes"; refreshHeader(); renderPhotos(); });
    $('#ownerOnly').on("click", () => { sortType = "owner"; refreshHeader(); renderPhotos(); });
    $('#byKeywords').on("click", () => { sortType = "keywords"; refreshHeader(); renderPhotos(); });
    $("#setSearchKeywordsCmd").on("click", () => { keywords = $("#keywords").val(); renderPhotos(); });
    $('#aboutCmd').on("click", renderAbout);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Header management
function loggedUserMenu() {
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        let manageUserMenu = `
            <span class="dropdown-item" id="renderManageUsersMenuCmd">
                <i class="menuIcon fas fa-user-cog mx-2"></i> Gestion des usagers
            </span>
            <div class="dropdown-divider"></div>
        `;
        return `
            ${loggedUser.isAdmin ? manageUserMenu : ""}
            <span class="dropdown-item" id="logoutCmd">
                <i class="menuIcon fa fa-sign-out mx-2"></i> Déconnexion
            </span>
            <span class="dropdown-item" id="editProfilMenuCmd">
                <i class="menuIcon fa fa-user-edit mx-2"></i> Modifier votre profil
            </span>
            <div class="dropdown-divider"></div>
            <span class="dropdown-item" id="listPhotosMenuCmd">
                <i class="menuIcon fa fa-image mx-2"></i> Liste des photos
            </span>
        `;
    }
    else
        return `
            <span class="dropdown-item" id="loginCmd">
                <i class="menuIcon fa fa-sign-in mx-2"></i> Connexion
            </span>`;
}
function viewMenu(viewName) {
    if (viewName == "photosList") {
        checkIcon = '<i class="menuIcon fa fa-check mx-2"></i>';
        uncheckIcon = '<i class="menuIcon fa fa-fw mx-2"></i>';
        sortByDateCheck = (sortType == "date") ? checkIcon : uncheckIcon;
        sortByOwners = (sortType == "owners") ? checkIcon : uncheckIcon;
        sortByLikes = (sortType == "likes") ? checkIcon : uncheckIcon;
        ownerOnly = (sortType == "owner") ? checkIcon : uncheckIcon;
        byKeywords = (sortType == "keywords") ? checkIcon : uncheckIcon;
        return `
            <div class="dropdown-divider"></div>
            <span class="dropdown-item" id="sortByDate">
                ${sortByDateCheck} <i class="menuIcon fa fa-calendar mx-2"></i>Photos par date de création
            </span>
            <span class="dropdown-item" id="sortByLikes">
                ${sortByLikes} <i class="menuIcon fa-solid fa-heart mx-2"></i>Photos les plus aimées
            </span>
            <span class="dropdown-item" id="byKeywords">
                ${byKeywords} <i class="menuIcon fa-solid fa-search mx-2"></i>Photos par mots-clés
            </span>
            <span class="dropdown-item" id="sortByOwners">
                ${sortByOwners} <i class="menuIcon fa fa-users mx-2"></i>Photos par créateur
            </span>
            <span class="dropdown-item" id="ownerOnly">
                ${ownerOnly} <i class="menuIcon fa fa-user mx-2"></i>Mes photos
            </span>
        `;
    }
    else
        return "";
}
function connectedUserAvatar() {
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser)
        return `
            <div class="UserAvatarSmall" userId="${loggedUser.Id}" id="editProfilCmd" style="background-image:url('${loggedUser.Avatar}')" title="${loggedUser.Name}"></div>
        `;
    return "";
}
function refreshHeader() {
    UpdateHeader(currentViewTitle, currentViewName);
}
function UpdateHeader(viewTitle, viewName) {
    currentViewTitle = viewTitle;
    currentViewName = viewName;
    $("#header").empty();
    $("#header").append(`
        <span title="Liste des photos" id="listPhotosCmd"><img src="images/PhotoCloudLogo.png" class="appLogo"></span>
        <span class="viewTitle">${viewTitle} 
            <div class="cmdIcon fa fa-plus" id="newPhotoCmd" title="Ajouter une photo"></div>
        </span>

        <div class="headerMenusContainer">
            <span>&nbsp</span> <!--filler-->
            <i title="Modifier votre profil"> ${connectedUserAvatar()} </i>         
            <div class="dropdown ms-auto dropdownLayout">
                <div data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="cmdIcon fa fa-ellipsis-vertical"></i>
                </div>
                <div class="dropdown-menu noselect">
                    ${loggedUserMenu()}
                    ${viewMenu(viewName)}
                    <div class="dropdown-divider"></div>
                    <span class="dropdown-item" id="aboutCmd">
                        <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
                    </span>
                </div>
            </div>

        </div>
    `);
    if (sortType == "keywords" && viewName == "photosList") {
        $("#customHeader").show();
        $("#customHeader").empty();
        $("#customHeader").append(`
            <div class="searchContainer">
                <input type="search" class="form-control" placeholder="Recherche par mots-clés" id="keywords" value="${keywords}"/>
                <i class="cmdIcon fa fa-search" id="setSearchKeywordsCmd"></i>
            </div>
        `);
    } else {
        $("#customHeader").hide();
    }
    attachCmd();
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Actions and command
async function login(credential) {
    console.log("login");
    loginMessage = "";
    EmailError = "";
    passwordError = "";
    Email = credential.Email;
    await API.login(credential.Email, credential.Password);
    if (API.error) {
        switch (API.currentStatus) {
            case 482: passwordError = "Mot de passe incorrect"; renderLoginForm(); break;
            case 481: EmailError = "Courriel introuvable"; renderLoginForm(); break;
            default: renderError("Le serveur ne répond pas"); break;
        }
    } else {
        let loggedUser = API.retrieveLoggedUser();
        if (loggedUser.VerifyCode == 'verified') {
            if (!loggedUser.isBlocked)
                renderPhotos();
            else {
                loginMessage = "Votre compte a été bloqué par l'administrateur";
                logout();
            }
        }
        else
            renderVerify();
    }
}
async function logout() {
    console.log('logout');
    await API.logout();
    renderLoginForm();
}
function isVerified() {
    let loggedUser = API.retrieveLoggedUser();
    return loggedUser.VerifyCode == "verified";
}
async function verify(verifyCode) {
    let loggedUser = API.retrieveLoggedUser();
    if (await API.verifyEmail(loggedUser.Id, verifyCode)) {
        renderPhotos();
    } else {
        renderError("Désolé, votre code de vérification n'est pas valide...");
    }
}
async function editProfil(profil) {
    if (await API.modifyUserProfil(profil)) {
        let loggedUser = API.retrieveLoggedUser();
        if (loggedUser) {
            if (isVerified()) {
                renderPhotos();
            } else
                renderVerify();
        } else
            renderLoginForm();

    } else {
        renderError("Un problème est survenu.");
    }
}
async function createProfil(profil) {
    if (await API.register(profil)) {
        loginMessage = "Votre compte a été créé. Veuillez prendre vos courriels pour réccupérer votre code de vérification qui vous sera demandé lors de votre prochaine connexion."
        renderLoginForm();
    } else {
        renderError("Un problème est survenu.");
    }
}
async function adminDeleteAccount(userId) {
    if (await API.unsubscribeAccount(userId)) {
        renderManageUsers();
    } else {
        renderError("Un problème est survenu.");
    }
}
async function deleteProfil() {
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        if (await API.unsubscribeAccount(loggedUser.Id)) {
            loginMessage = "Votre compte a été effacé.";
            logout();
        } else
            renderError("Un problème est survenu.");
    }
}
async function newPhoto(photo) {
    let loggedUser = API.retrieveLoggedUser();
    photo.OwnerId = loggedUser.Id;
    photo.Date = Date.now();
    if (await API.CreatePhoto(photo))
        renderPhotos();
    else
        renderError("Un problème est survenu.");
}
async function editPhoto(photo) {
    if (await API.UpdatePhoto(photo))
        renderPhotos();
    else
        renderError("Un problème est survenu.");
}
async function deletePhoto(photoId) {
    if (await API.DeletePhoto(photoId))
        renderPhotos();
    else
        renderError("Un problème est survenu.");
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Views rendering
function showWaitingGif() {
    eraseContent();
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='images/Loading_icon.gif' /></div>'"));
}
function eraseContent() {
    $("#content").empty();
}
function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}
function restoreContentScrollPosition() {
    $("#content")[0].scrollTop = contentScrollPosition;
}
async function renderError(message) {
    noTimeout();
    switch (API.currentStatus) {
        case 401:
        case 403:
        case 405:
            message = "Accès refusé...Expiration de votre session. Veuillez vous reconnecter.";
            await API.logout();
            renderLoginForm();
            break;
        case 404: message = "Ressource introuvable..."; break;
        case 409: message = "Ressource conflictuelle..."; break;
        default: if (!message) message = "Un problème est survenu...";
    }
    saveContentScrollPosition();
    eraseContent();
    UpdateHeader("Problème", "error");
    $("#newPhotoCmd").hide();
    $("#content").append(
        $(`
            <div class="errorContainer">
                <b>${message}</b>
            </div>
            <hr>
            <div class="form">
                <button id="connectCmd" class="form-control btn-primary">Connexion</button>
            </div>
        `)
    );
    $('#connectCmd').on('click', renderLoginForm);
    /*
     $("#content").append(
        $(`
            <div class="errorContainer">
                <b>${message}</b>
            </div>
            <hr>
            <div class="systemErrorContainer">
                <b>Message du serveur</b> : <br>
                ${API.currentHttpError} <br>

                <b>Status Http</b> :
                ${API.currentStatus}
            </div>
        `)
    ); */
}
function renderAbout() {
    timeout();
    saveContentScrollPosition();
    eraseContent();
    UpdateHeader("À propos...", "about");
    $("#newPhotoCmd").hide();
    $("#createContact").hide();
    $("#abort").show();
    $("#content").append(
        $(`
            <div class="aboutContainer">
                <h2>Gestionnaire de photos</h2>
                <hr>
                <p>
                    Petite application de gestion de photos multiusagers à titre de démonstration
                    d'interface utilisateur monopage réactive.
                </p>
                <p>
                    Auteur: Nicolas Chourot
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2023
                </p>
            </div>
        `))
}
function installPeriodicRefreshPhotosList() {
    setInterval(async () => {
        if (currentViewName == "photosList") {
            let etag = await API.GetPhotosETag();
            if (etag) {
                if (currentETag != etag) {
                    currentETag = etag;
                    saveContentScrollPosition();
                    renderPhotosList();
                    restoreContentScrollPosition();
                }
            } else {
                renderError("Le serveur ne répond pas.")
            }
        }
    }, periodicRefreshPhotosListPeriod * 1000);
}
async function renderPhotos() {
    timeout();
    showWaitingGif();
    UpdateHeader('Liste des photos', 'photosList')
    $("#newPhotoCmd").show();
    $("#abort").hide();
    renderPhotosList();
}
function compareOwnerName(p1, p2) {
    return p1.Owner.Name.localeCompare(p2.Owner.Name);
}
function compareLikes(p1, p2) {
    if (p1.Likes == p2.Likes) return 0;
    if (p1.Likes > p2.Likes) return -1;
    return 1;
}
function renderPhoto(photo, loggedUser) {
    let sharedIndicator = "";
    let editCmd = "";
    if (photo.OwnerId == loggedUser.Id || loggedUser.isAdmin) {
        if (photo.Shared)
            sharedIndicator = `
                <div class="UserAvatarSmall transparentBackground" style="background-image:url('images/shared.png')" title="partagée">
                </div>
            `;
        editCmd = `
            <span photoId="${photo.Id}" class="editCmd cmdIconSmall fa fa-pencil" title="Editer ${photo.Title}"> </span>
            <span photoId="${photo.Id}" class="deleteCmd cmdIconSmall fa fa-trash" title="Effacer ${photo.Title}"> </span>
        `;
    }
    let html = ` 
        <div class="photoLayout" photo_id="${photo.Id}">
            <div class="photoTitleContainer" title="${photo.Description}">
                <div class="photoTitle ellipsis">${photo.Title}</div> 
                ${editCmd}
            </div>
            <div photoId="${photo.Id}" class="detailsCmd photoImage" style="background-image:url('${photo.Image}')">
                <div class="UserAvatarSmall transparentBackground" style="background-image:url('${photo.Owner.Avatar}')" title="${photo.Owner.Name}"></div>
                ${sharedIndicator}
            </div>
            <div class="photoCreationDate">${convertToFrenchDate(photo.Date)} 
                <div class="likesSummary">
                    ${photo.Likes}
                    <i class="cmdIconSmall fa-regular fa-thumbs-up"></i> 
                </div>
            </div>
        </div>`;
    return html;
}
async function renderPhotosList(appendToView = false) {
    let photosCount = limit * (offset + 1);
    let queryString = appendToView ? "?sort=date,desc&limit=" + limit + "&offset=" + offset : "?sort=date,desc&limit=" + photosCount + "&offset=" + 0;
    if (sortType == "keywords") {
        if (keywords != "") {
            let searchQueryString = "&Title=";
            let keys = keywords.split(" ");
            keys.forEach(key => {
                searchQueryString += "*" + key + "*,";
            });
            searchQueryString = searchQueryString.slice(0, -1);
            queryString += searchQueryString;
        }
    }
    console.log(limit, offset, appendToView);
    let photos = await API.GetPhotos(queryString);

    if (!photos) {
        renderError("Un problème est survenu.");
    } else {
        currentETag = photos.ETag;
        let photosLayout;

        if (!appendToView) {
            saveContentScrollPosition();
            eraseContent();
            photosLayout = $("<div class='photosLayout' id='photosLayout'>");
            $("#content").append(photosLayout);
        } else {
            photosLayout = $("#photosLayout");
        }

        if (photos.data.length > 0) {
            let loggedUser = API.retrieveLoggedUser();
            switch (sortType) {
                case "date": /* default sort */ break;
                case "owners": photos.data.sort(compareOwnerName); break;
                case "likes": photos.data.sort(compareLikes); break;
                case "owner": photos.data = photos.data.filter(p => { return p.OwnerId == loggedUser.Id; }); break;
                case "keywords": break;
            }
            photos.data.forEach(photo => { photosLayout.append(renderPhoto(photo, loggedUser)); });

            $("#content").off();
            $("#content").on("scroll", function () {
                if ($("#content").scrollTop() + $("#content").innerHeight() > ($("#photosLayout").height() /*- photoContainerHeight*/)) {
                    offset++;
                    renderPhotosList(true /* appendToView */);
                }
            });
        } else {
            if (!appendToView)
                photosLayout.append($(`<h4 class="form">aucune photo</h4>`));
            else {
                offset--;
            }
        }
        if (!appendToView)
            restoreContentScrollPosition();
        $("#newPhotoCmd").on("click", function () {
            saveContentScrollPosition();
            renderNewPhotoForm();
        });
        $(".editCmd").on("click", function () {
            saveContentScrollPosition();
            renderEditPhotoForm($(this).attr("photoId"));
        });
        $(".deleteCmd").on("click", function () {
            saveContentScrollPosition();
            renderDeletePhotoForm($(this).attr("photoId"));
        });
        $(".detailsCmd").on("click", function () {
            saveContentScrollPosition();
            renderPhotoDetails($(this).attr("photoId"));
        });
        $(".contactRow").on("click", function (e) { e.preventDefault(); });
    }
}
async function renderPhotoDetails(photoId) {
    timeout();
    let photo = await API.GetPhotosById(photoId);
    if (photo) {
        let userLike = await API.GetUserPhotolike(photo.Id);
        let likes = await API.GetPhotolikes(photo.Id);
        let likesList = "";
        likes.forEach(like => {
            likesList += like.UserName + "\n";
        })
        eraseContent();
        UpdateHeader("Détails", "createProfil");
        $("#newPhotoCmd").hide();
        $("#content").append(` 
            <div class="content">
                <div class="photoDetailsOwner">
                <div class="UserAvatarSmall" style="background-image:url('${photo.Owner.Avatar}')" title="${photo.Owner.Name}"></div>
                    ${photo.Owner.Name}
                </div>
                <hr>
                <div class="photoDetailsTitle">${photo.Title}</div>
                <img src="${photo.Image}" class="photoDetailsLargeImage">
                <div class="photoDetailsCreationDate">
                    ${convertToFrenchDate(photo.Date)}
                    <div class="likesSummary">
                        ${photo.Likes}
                    <i class="cmdIconSmall ${userLike ? "fa" : "fa-regular"} fa-thumbs-up" id="addRemoveLikeCmd" title="${likesList}" ></i> 
                </div>
                </div>
            <div class="photoDetailsDescription">${photo.Description}</div>`
        );
        $("#addRemoveLikeCmd").on("click", () => {
            API.AddRemovePhotolike(photo.Id);
            renderPhotoDetails(photo.Id);
        });
    }
}
async function renderNewPhotoForm() {
    timeout();
    eraseContent();
    UpdateHeader("Ajout de photos", "newPhotos");
    $("#newPhotoCmd").hide();
    $("#content").append(` 
        <form class="form" id="newPhotoForm">
            <input type="hidden" name = "Likes" value="0">
            <fieldset>
                <legend>Informations</legend>
                <input  type="text" 
                        class="form-control AlphaNum" 
                        name="Title" 
                        id="Title"
                        placeholder="Titre" 
                        required 
                        RequireMessage = 'Veuillez entrer un titre'
                        InvalidMessage = 'Le titre contient des caractères spéciaux' />

                <textarea class="form-control" 
                          name="Description" 
                          id="Description"
                          placeholder="Description" 
                          rows="4"
                          required 
                          RequireMessage = 'Veuillez entrer une Description'></textarea>
            
                <input  type="checkbox" 
                        class="" 
                        name="Shared" 
                        id="Shared"  />  
                <label for="Shared">Partagée</label>
            </fieldset>
            <fieldset>
                <legend>Image</legend>
                <div class='imageUploader' 
                     newImage='true' 
                     controlId='Image' 
                     imageSrc='images/PhotoCloudLogo.png' 
                     required 
                     RequireMessage = 'Veuillez entrer une image'
                     waitingImage="images/Loading_icon.gif">
            </div>
            </fieldset>
            <input type='submit' name='submit' value="Enregistrer" class="form-control btn-primary">
        </form>
        <div class="cancel">
            <button id="abortNewPhotoCmd" class="form-control btn-secondary">Annuler</button>
        </div>
    `);
    initFormValidation();
    initImageUploaders();
    $('#abortNewPhotoCmd').on('click', renderPhotos);
    $('#newPhotoForm').on("submit", function (event) {
        let photo = getFormData($('#newPhotoForm'));
        photo.Shared = $("#Shared").prop("checked");
        event.preventDefault();
        showWaitingGif();
        newPhoto(photo);
    });
}
async function renderEditPhotoForm(photoId) {
    timeout(delayTimeOut);
    let photo = await API.GetPhotosById(photoId);
    if (photo) {
        eraseContent();
        UpdateHeader("Modification de photo", "editPhoto");
        $("#newPhotoCmd").hide();
        $("#content").append(` 
        <form class="form" id="editPhotoForm">
            <input type="hidden" name = "Id" value="${photo.Id}">
            <input type="hidden" name = "Date" value="${photo.Date}">
            <input type="hidden" name = "OwnerId" value="${photo.OwnerId}">
            <input type="hidden" name = "Likes" value="${photo.Likes}">
            <fieldset>
                <legend>Informations</legend>
                <input  type="text" 
                        class="form-control AlphaNum" 
                        name="Title" 
                        id="Title"
                        placeholder="Titre" 
                        required 
                        RequireMessage = 'Veuillez entrer un titre'
                        InvalidMessage = 'Le titre contient des caractères spéciaux' 
                        value="${photo.Title}"/>

                <textarea class="form-control" 
                          name="Description" 
                          id="Description"
                          placeholder="Description" 
                          rows="4"
                          required 
                          RequireMessage = 'Veuillez entrer une Description'>${photo.Description}</textarea>
            
                <input  type="checkbox" 
                        name="Shared" 
                        id="Shared"  
                        ${photo.Shared ? "checked" : ""}
                        />  
                <label for="Shared">Partagée</label>
            </fieldset>
            <fieldset>
                <legend>Image</legend>
                <div class='imageUploader' 
                     newImage='false' 
                     controlId='Image' 
                     imageSrc='${photo.Image}' 
                     required 
                     RequireMessage = 'Veuillez entrer une image'
                     waitingImage="images/Loading_icon.gif">
            </div>
            </fieldset>
            <input type='submit' name='submit' value="Enregistrer" class="form-control btn-primary">
        </form>
        <div class="cancel">
            <button id="abortEditPhotoCmd" class="form-control btn-secondary">Annuler</button>
        </div>
    `);
        initFormValidation();
        initImageUploaders();
        $('#abortEditPhotoCmd').on('click', renderPhotos);
        $('#editPhotoForm').on("submit", function (event) {
            let photo = getFormData($('#editPhotoForm'));
            photo.Shared = $("#Shared").prop("checked");
            event.preventDefault();
            showWaitingGif();
            editPhoto(photo);
        });
    } else
        renderError("Un problème est survenu.")
}
async function renderDeletePhotoForm(photoId) {
    timeout();
    let photo = await API.GetPhotosById(photoId);
    if (photo) {
        eraseContent();
        UpdateHeader("Retrait de photo", "editPhoto");
        $("#newPhotoCmd").hide();
        $("#content").append(`
            <br>
            <div class="confirmForm">
                <h4> Voulez-vous vraiment effacer cette photo? </h4>
                <br>
                <div class="photoLayout">
                    <div class="photoTitle" title="${photo.Description}">${photo.Title}</div>
                    <div class="photoImage" style="background-image:url('${photo.Image}')"> </div>
                </div>       
                <br>
                <button photoId=${photo.Id} class="deletePhotoCmd form-control btn-danger">Effacer la photo</button>
                <br>
                <button id="abortDeletePhotoCmd" class="form-control btn-secondary">Annuler</button>
            </div>
        `);
        $(".deletePhotoCmd").on("click", function () { deletePhoto($(this).attr("photoId")); })
        $("#abortDeletePhotoCmd").on("click", renderPhotos);
    } else
        renderError("Un problème est survenu.")
}
function renderVerify() {
    eraseContent();
    UpdateHeader("Vérification", "verify");
    $("#newPhotoCmd").hide();
    $("#content").append(`
        <div class="content">
            <form class="form" id="verifyForm">
                <b>Veuillez entrer le code de vérification de que vous avez reçu par courriel</b>
                <input  type='text' 
                        name='Code'
                        class="form-control"
                        required
                        RequireMessage = 'Veuillez entrer le code que vous avez reçu par courriel'
                        InvalidMessage = 'Courriel invalide';
                        placeholder="Code de vérification de courriel" > 
                <input type='submit' name='submit' value="Vérifier" class="form-control btn-primary">
            </form>
        </div>
    `);
    initFormValidation(); // important do to after all html injection!
    $('#verifyForm').on("submit", function (event) {
        let verifyForm = getFormData($('#verifyForm'));
        event.preventDefault();
        showWaitingGif();
        verify(verifyForm.Code);
    });
}
function renderCreateProfil() {
    noTimeout();
    eraseContent();
    UpdateHeader("Inscription", "createProfil");
    $("#newPhotoCmd").hide();
    $("#content").append(`
        <br/>
        <form class="form" id="createProfilForm"'>
            <fieldset>
                <legend>Adresse ce courriel</legend>
                <input  type="email" 
                        class="form-control Email" 
                        name="Email" 
                        id="Email"
                        placeholder="Courriel" 
                        required 
                        RequireMessage = 'Veuillez entrer votre courriel'
                        InvalidMessage = 'Courriel invalide'
                        CustomErrorMessage ="Ce courriel est déjà utilisé"/>

                <input  class="form-control MatchedInput" 
                        type="text" 
                        matchedInputId="Email"
                        name="matchedEmail" 
                        id="matchedEmail" 
                        placeholder="Vérification" 
                        required
                        RequireMessage = 'Veuillez entrez de nouveau votre courriel'
                        InvalidMessage="Les courriels ne correspondent pas" />
            </fieldset>
            <fieldset>
                <legend>Mot de passe</legend>
                <input  type="password" 
                        class="form-control" 
                        name="Password" 
                        id="Password"
                        placeholder="Mot de passe" 
                        required 
                        RequireMessage = 'Veuillez entrer un mot de passe'
                        InvalidMessage = 'Mot de passe trop court'/>

                <input  class="form-control MatchedInput" 
                        type="password" 
                        matchedInputId="Password"
                        name="matchedPassword" 
                        id="matchedPassword" 
                        placeholder="Vérification" required
                        InvalidMessage="Ne correspond pas au mot de passe" />
            </fieldset>
            <fieldset>
                <legend>Nom</legend>
                <input  type="text" 
                        class="form-control Alpha" 
                        name="Name" 
                        id="Name"
                        placeholder="Nom" 
                        required 
                        RequireMessage = 'Veuillez entrer votre nom'
                        InvalidMessage = 'Nom invalide'/>
            </fieldset>
            <fieldset>
                <legend>Avatar</legend>
                <div class='imageUploader' 
                        newImage='true' 
                        controlId='Avatar' 
                        imageSrc='images/no-avatar.png' 
                        waitingImage="images/Loading_icon.gif">
            </div>
            </fieldset>
   
            <input type='submit' name='submit' id='saveUser' value="Enregistrer" class="form-control btn-primary">
        </form>
        <div class="cancel">
            <button class="form-control btn-secondary" id="abortCreateProfilCmd">Annuler</button>
        </div>
    `);
    $('#loginCmd').on('click', renderLoginForm);
    initFormValidation(); // important do to after all html injection!
    initImageUploaders();
    $('#abortCreateProfilCmd').on('click', renderLoginForm);
    addConflictValidation(API.checkConflictURL(), 'Email', 'saveUser');
    $('#createProfilForm').on("submit", function (event) {
        let profil = getFormData($('#createProfilForm'));
        delete profil.matchedPassword;
        delete profil.matchedEmail;
        event.preventDefault();
        showWaitingGif();
        createProfil(profil);
    });
}
async function renderManageUsers() {
    timeout();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser.isAdmin) {
        if (isVerified()) {
            showWaitingGif();
            UpdateHeader('Gestion des usagers', 'manageUsers')
            $("#newPhotoCmd").hide();
            $("#abort").hide();
            let users = await API.GetAccounts();
            if (API.error) {
                renderError();
            } else {
                $("#content").empty();
                users.data.forEach(user => {
                    if (user.Id != loggedUser.Id) {
                        let typeIcon = user.Authorizations.readAccess == 2 ? "fas fa-user-cog" : "fas fa-user-alt";
                        typeTitle = user.Authorizations.readAccess == 2 ? "Retirer le droit administrateur à" : "Octroyer le droit administrateur à";
                        let blockedClass = user.Authorizations.readAccess == -1 ? "class=' blockUserCmd cmdIconVisible fa fa-ban redCmd'" : "class='blockUserCmd cmdIconVisible fa-regular fa-circle greenCmd'";
                        let blockedTitle = user.Authorizations.readAccess == -1 ? "Débloquer $name" : "Bloquer $name";
                        let userRow = `
                        <div class="UserRow"">
                            <div class="UserContainer noselect">
                                <div class="UserLayout">
                                    <div class="UserAvatar" style="background-image:url('${user.Avatar}')"></div>
                                    <div class="UserInfo">
                                        <span class="UserName">${user.Name}</span>
                                        <a href="mailto:${user.Email}" class="UserEmail" target="_blank" >${user.Email}</a>
                                    </div>
                                </div>
                                <div class="UserCommandPanel">
                                    <span class="promoteUserCmd cmdIconVisible ${typeIcon} dodgerblueCmd" title="${typeTitle} ${user.Name}" userId="${user.Id}"></span>
                                    <span ${blockedClass} title="${blockedTitle}" userId="${user.Id}" ></span>
                                    <span class="removeUserCmd cmdIconVisible fas fa-user-slash goldenrodCmd" title="Effacer ${user.Name}" userId="${user.Id}"></span>
                                </div>
                            </div>
                        </div>           
                        `;
                        $("#content").append(userRow);
                    }
                });
                $(".promoteUserCmd").on("click", async function () {
                    let userId = $(this).attr("userId");
                    await API.PromoteUser(userId);
                    renderManageUsers();
                });
                $(".blockUserCmd").on("click", async function () {
                    let userId = $(this).attr("userId");
                    await API.BlockUser(userId);
                    renderManageUsers();
                });
                $(".removeUserCmd").on("click", function () {
                    let userId = $(this).attr("userId");
                    renderConfirmDeleteAccount(userId);
                });
            }
        } else
            renderVerify();
    } else
        renderLoginForm();
}
async function renderConfirmDeleteAccount(userId) {
    timeout();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        let userToDelete = (await API.GetAccount(userId)).data;
        if (!API.error) {
            eraseContent();
            UpdateHeader("Retrait de compte", "confirmDeleteAccoun");
            $("#newPhotoCmd").hide();
            $("#content").append(`
                <div class="content loginForm">
                    <br>
                    <div class="form UserRow ">
                        <h4> Voulez-vous vraiment effacer cet usager et toutes ses photos? </h4>
                        <div class="UserContainer noselect">
                            <div class="UserLayout">
                                <div class="UserAvatar" style="background-image:url('${userToDelete.Avatar}')"></div>
                                <div class="UserInfo">
                                    <span class="UserName">${userToDelete.Name}</span>
                                    <a href="mailto:${userToDelete.Email}" class="UserEmail" target="_blank" >${userToDelete.Email}</a>
                                </div>
                            </div>
                        </div>
                    </div>           
                    <div class="form">
                        <button class="form-control btn-danger" id="deleteAccountCmd">Effacer</button>
                        <br>
                        <button class="form-control btn-secondary" id="abortDeleteAccountCmd">Annuler</button>
                    </div>
                </div>
            `);
            $("#deleteAccountCmd").on("click", function () {
                adminDeleteAccount(userToDelete.Id);
            });
            $("#abortDeleteAccountCmd").on("click", renderManageUsers);
        } else {
            renderError("Une erreur est survenue");
        }
    }
}
function renderEditProfilForm() {
    timeout();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        eraseContent();
        UpdateHeader("Profil", "editProfil");
        $("#newPhotoCmd").hide();
        $("#content").append(`
            <br/>
            <form class="form" id="editProfilForm"'>
                <input type="hidden" name="Id" id="Id" value="${loggedUser.Id}"/>
                <fieldset>
                    <legend>Adresse ce courriel</legend>
                    <input  type="email" 
                            class="form-control Email" 
                            name="Email" 
                            id="Email"
                            placeholder="Courriel" 
                            required 
                            RequireMessage = 'Veuillez entrer votre courriel'
                            InvalidMessage = 'Courriel invalide'
                            CustomErrorMessage ="Ce courriel est déjà utilisé"
                            value="${loggedUser.Email}" >

                    <input  class="form-control MatchedInput" 
                            type="text" 
                            matchedInputId="Email"
                            name="matchedEmail" 
                            id="matchedEmail" 
                            placeholder="Vérification" 
                            required
                            RequireMessage = 'Veuillez entrez de nouveau votre courriel'
                            InvalidMessage="Les courriels ne correspondent pas" 
                            value="${loggedUser.Email}" >
                </fieldset>
                <fieldset>
                    <legend>Mot de passe</legend>
                    <input  type="password" 
                            class="form-control" 
                            name="Password" 
                            id="Password"
                            placeholder="Mot de passe" 
                            InvalidMessage = 'Mot de passe trop court' >

                    <input  class="form-control MatchedInput" 
                            type="password" 
                            matchedInputId="Password"
                            name="matchedPassword" 
                            id="matchedPassword" 
                            placeholder="Vérification" 
                            InvalidMessage="Ne correspond pas au mot de passe" >
                </fieldset>
                <fieldset>
                    <legend>Nom</legend>
                    <input  type="text" 
                            class="form-control Alpha" 
                            name="Name" 
                            id="Name"
                            placeholder="Nom" 
                            required 
                            RequireMessage = 'Veuillez entrer votre nom'
                            InvalidMessage = 'Nom invalide'
                            value="${loggedUser.Name}" >
                </fieldset>
                <fieldset>
                    <legend>Avatar</legend>
                    <div class='imageUploader' 
                            newImage='false' 
                            controlId='Avatar' 
                            imageSrc='${loggedUser.Avatar}' 
                            waitingImage="images/Loading_icon.gif">
                </div>
                </fieldset>

                <input type='submit' name='submit' id='saveUser' value="Enregistrer" class="form-control btn-primary">
                
            </form>
            <div class="cancel">
                <button class="form-control btn-secondary" id="abortEditProfilCmd">Annuler</button>
            </div>

            <div class="cancel">
                <hr>
                <button class="form-control btn-warning" id="confirmDelelteProfilCMD">Effacer le compte</button>
            </div>
        `);
        initFormValidation(); // important do to after all html injection!
        initImageUploaders();
        addConflictValidation(API.checkConflictURL(), 'Email', 'saveUser');
        $('#abortEditProfilCmd').on('click', renderPhotos);
        $('#confirmDelelteProfilCMD').on('click', renderConfirmDeleteProfil);
        $('#editProfilForm').on("submit", function (event) {
            let profil = getFormData($('#editProfilForm'));
            delete profil.matchedPassword;
            delete profil.matchedEmail;
            event.preventDefault();
            showWaitingGif();
            editProfil(profil);
        });
    }
}
function renderConfirmDeleteProfil() {
    timeout();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        eraseContent();
        UpdateHeader("Retrait de compte", "confirmDeleteProfil");
        $("#newPhotoCmd").hide();
        $("#content").append(`
            <div class="content loginForm">
                <br>
                
                <div class="form">
                 <h3> Voulez-vous vraiment effacer votre compte? </h3>
                    <button class="form-control btn-danger" id="deleteProfilCmd">Effacer mon compte</button>
                    <br>
                    <button class="form-control btn-secondary" id="cancelDeleteProfilCmd">Annuler</button>
                </div>
            </div>
        `);
        $("#deleteProfilCmd").on("click", deleteProfil);
        $('#cancelDeleteProfilCmd').on('click', renderEditProfilForm);
    }
}
function renderExpiredSession() {
    noTimeout();
    loginMessage = "Votre session est expirée. Veuillez vous reconnecter.";
    logout();
    renderLoginForm();
}
function renderLoginForm() {
    noTimeout();
    eraseContent();
    UpdateHeader("Connexion", "Login");
    $("#newPhotoCmd").hide();
    $("#content").append(`
        <div class="content" style="text-align:center">
            <div class="loginMessage">${loginMessage}</div>
            <form class="form" id="loginForm">
                <input  type='email' 
                        name='Email'
                        class="form-control"
                        required
                        RequireMessage = 'Veuillez entrer votre courriel'
                        InvalidMessage = 'Courriel invalide'
                        placeholder="adresse de courriel"
                        value='${Email}'> 
                <span style='color:red'>${EmailError}</span>
                <input  type='password' 
                        name='Password' 
                        placeholder='Mot de passe'
                        class="form-control"
                        required
                        RequireMessage = 'Veuillez entrer votre mot de passe'
                        InvalidMessage = 'Mot de passe trop court' >
                <span style='color:red'>${passwordError}</span>
                <input type='submit' name='submit' value="Entrer" class="form-control btn-primary">
            </form>
            <div class="form">
                <hr>
                <button class="form-control btn-info" id="createProfilCmd">Nouveau compte</button>
            </div>
        </div>
    `);
    initFormValidation(); // important do to after all html injection!
    $('#createProfilCmd').on('click', renderCreateProfil);
    $('#loginForm').on("submit", function (event) {
        let credential = getFormData($('#loginForm'));
        event.preventDefault();
        showWaitingGif();
        login(credential);
    });
}
function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    console.log($form.serializeArray());
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}

