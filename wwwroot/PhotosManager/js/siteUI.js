//<span class="cmdIcon fa-solid fa-ellipsis-vertical"></span>
let contentScrollPosition = 0;
let sortType = "date";
let viewName = "";
let loginMessage = "";
let Email = "";
let EmailError = "";
let passwordError = "";

Init_UI();

function Init_UI() {
    renderPhotos();
}

function attachCmd() {
    $('#logoutCmd').on('click', logout);
    $('#listPhotosCmd').on('click', renderPhotos);
    $('#editProfilMenuCmd').on('click', renderEditProfilForm);
    $('#editProfilCmd').on('click', renderEditProfilForm);
    $('#abort').on("click", renderPhotos);
    $('#aboutCmd').on("click", renderAbout);
    $('#createContact').on("click", async function () {
        saveContentScrollPosition();
        renderCreateContactForm();
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Header management
function loggedUserMenu() {
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser)
        return `
            <span class="dropdown-item" id="logoutCmd">
                <i class="menuIcon fa fa-sign-out mx-2"></i> Déconnexion
            </span>
            <span class="dropdown-item" id="editProfilMenuCmd">
                <i class="menuIcon fa fa-user-edit mx-2"></i> Modifier votre profil
            </span>
            <span class="dropdown-item" id="listPhotosCmd">
                <i class="menuIcon fa fa-image mx-2"></i> Liste des photos
            </span>`;
    else
        return `
            <span class="dropdown-item" id="loginCmd">
                <i class="menuIcon fa fa-sign-in mx-2"></i> Connexion
            </span>`;
}
function viewMenu(viewName) {
    if (viewName == "photoList") {
        checkIcon = '<i class="menuIcon fa fa-check mx-2"></i>';
        uncheckIcon = '<i class="menuIcon fa fa-fw mx-2"></i>';
        sortByDateCheck = (sortType == "date") ? checkIcon : uncheckIcon;
        sortByOwners = (sortType == "owners") ? checkIcon : uncheckIcon;
        ownerOnly = (sortType == "owner") ? checkIcon : uncheckIcon;
        return `
            <div class="dropdown-divider"></div>
            <a href="photosList.php?sort=date" class="dropdown-item">
                ${sortByDateCheck} <i class="menuIcon fa fa-calendar mx-2"></i>Photos par date de création
            </a>
            <a href="photosList.php?sort=owners" class="dropdown-item">
                ${sortByOwners} <i class="menuIcon fa fa-users mx-2"></i>Photos par créateur
            </a>
            <a href="photosList.php?sort=owner" class="dropdown-item">
                ${ownerOnly} <i class="menuIcon fa fa-user mx-2"></i>Mes photos
            </a>
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
function UpdateHeader(viewTitle, viewName) {
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
            case 482: passwordError = "Mot de passe incorrect"; break;
            case 481: EmailError = "Courriel introuvable"; break;
            default: loginMessage = "Le serveur ne répond pas"; break;
        }
        renderLoginForm();
    } else {
        let loggedUser = API.retrieveLoggedUser();
        if (loggedUser.VerifyCode == 'verified')
            renderPhotos();
        else
            renderVerify();
    }
}
async function logout() {
    console.log('logout');
    if (await API.logout()) {
        renderLoginForm();
    } else {
        renderError("Un problème est survenu.");
    }
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
        renderPhotos();
    } else {
        renderError("Un problème est survenu.");
    }
}
async function createProfil(profil) {
    if (await API.register(profil)) {
        loginMessage = "Votre compte a été créé. Veuillez prendre vos courriels pour réccupérer votre code de vérification qui sou sera demander lors de votre prochaine connexion."
        renderLoginForm();
    } else {
        renderError("Un problème est survenu.");
    }
}
async function newPhoto(photo) {
    let loggedUser = API.retrieveLoggedUser();
    photo.OwnerId = loggedUser.Id;
    photo.Date = Date.now();
    if (await API.POST(photo))
        renderPhotos();
    else
        renderError("Un problème est survenu.");
}
async function editPhoto(photo) {
    photo.Date = Date.now();
    if (await API.PUT(photo))
        renderPhotos();
    else
        renderError("Un problème est survenu.");
}
async function deletePhoto(photoId) {
    if (await API.DELETE(photoId))
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
function renderAbout() {
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
async function renderPhotos() {
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        if (isVerified()) {
            showWaitingGif();
            UpdateHeader('Liste des photos', 'photoList')
            $("#newPhotoCmd").show();
            $("#abort").hide();
            let photos = await API.GET_ALL("?sort=date,desc");
            if (!photos) {
                renderError();
            } else {
                $("#content").empty();
                let photosLayout = $("<div class='photosLayout'>");
                $("#content").append(photosLayout);
                if (photos.data.length > 0) {
                    let sharedIndicator = "";
                    let editCmd = "";
                    let loggedUser = API.retrieveLoggedUser();
                    photos.data.forEach(photo => {
                        if (photo.OwnerId == loggedUser.Id) {
                            sharedIndicator = `
                        <div class="UserAvatarSmall transparentBackground" style="background-image:url('images/shared.png')" title="partagée">
                        </div>
                    `;
                            editCmd = `
                        <span photoId="${photo.Id}" class="editCmd cmdIconSmall fa fa-pencil" title="Editer ${photo.Title}"> </span>
                        <span photoId="${photo.Id}" class="deleteCmd cmdIconSmall fa fa-trash" title="Effacer ${photo.Title}"> </span>
                    `;
                        }
                        photosLayout.append(renderPhoto(photo, editCmd, sharedIndicator));
                    });
                    restoreContentScrollPosition();

                } else {
                    $('#content').append($(`<h4 class="form">aucune photo</h4>`));
                }
                $("#newPhotoCmd").on("click", function () {
                    saveContentScrollPosition();
                    renderNewPhotoForm();
                });
                // Attached click events on command icons
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
                $(".contactRow").on("click", function (e) { e.preventDefault(); })
            }
        } else
            renderVerify();
    } else
        renderLoginForm();
}
function renderPhoto(photo, editCmd = "", sharedIndicator = "") {
    let html = ` <div class="photoLayout" photo_id="${photo.Id}">
                    <div class="photoTitleContainer" title="${photo.Description}">
                        <div class="photoTitle ellipsis">${photo.Title}</div> 
                        ${editCmd}
                    </div>
                    <div photoId="${photo.Id}" class="detailsCmd photoImage" style="background-image:url('${photo.Image}')">
                        <div class="UserAvatarSmall transparentBackground" style="background-image:url('${photo.Owner.Avatar}')" title="${photo.Owner.Name}"></div>
                        ${sharedIndicator}
                    </div>
                    ${convertToFrenchDate(photo.Date)}
                </div>`;
    return html;
}
async function renderPhotoDetails(photoId) {
    let photo = await API.GET_ID(photoId);
    if (photo) {
        eraseContent();
        UpdateHeader("Inscription", "createProfil");
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
                </div>
            <div class="photoDetailsDescription">${photo.Description}</div>`
        );
    }
}
async function renderNewPhotoForm() {
    eraseContent();
    UpdateHeader("Inscription", "createProfil");
    $("#newPhotoCmd").hide();
    $("#content").append(` 
        <form class="form" id="newPhotoForm">
            <fieldset>
                <legend>Informations</legend>
                <input  type="text" 
                        class="form-control Alpha" 
                        name="Title" 
                        id="Title"
                        placeholder="Titre" 
                        required 
                        RequireMessage = 'Veuillez entrer un titre'
                        InvalidMessage = 'Le titre contient des caractères spéciaux' />

                <textarea class="form-control Alpha" 
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
            <button id="abortCmd" class="form-control btn-secondary">Annuler</button>
        </div>
    `);
    initFormValidation();
    initImageUploaders();
    $('#abortCmd').on('click', renderPhotos);
    $('#newPhotoForm').on("submit", function (event) {
        let photo = getFormData($('#newPhotoForm'));
        photo.Shared = $("#Shared").prop("checked");
        event.preventDefault();
        showWaitingGif();
        newPhoto(photo);
    });
}
async function renderEditPhotoForm(photoId) {
    let photo = await API.GET_ID(photoId);
    if (photo) {
        eraseContent();
        UpdateHeader("Mofication", "editPhoto");
        $("#newPhotoCmd").hide();
        $("#content").append(` 
        <form class="form" id="editPhotoForm">
            <input type="hidden" name = "Id" value="${photo.Id}">
            <input type="hidden" name = "OwnerId" value="${photo.OwnerId}">
            <fieldset>
                <legend>Informations</legend>
                <input  type="text" 
                        class="form-control Alpha" 
                        name="Title" 
                        id="Title"
                        placeholder="Titre" 
                        required 
                        RequireMessage = 'Veuillez entrer un titre'
                        InvalidMessage = 'Le titre contient des caractères spéciaux' 
                        value="${photo.Title}"/>

                <textarea class="form-control Alpha" 
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
            <button id="abortCmd" class="form-control btn-secondary">Annuler</button>
        </div>
    `);
        initFormValidation();
        initImageUploaders();
        $('#abortCmd').on('click', renderPhotos);
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
    let photo = await API.GET_ID(photoId);
    if (photo) {
        eraseContent();
        UpdateHeader("Mofication", "editPhoto");
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
                <button id="abortCmd" class="form-control btn-secondary">Annuler</button>
            </div>
        `);
        $(".deletePhotoCmd").on("click", function () { deletePhoto($(this).attr("photoId")); })
        $("#abortCmd").on("click", renderPhotos);
    }
}
function renderError(message) {
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
            <div class="systemErrorContainer">
                <b>Message du serveur</b> : <br>
                ${API.currentHttpError} <br>

                <b>Status Http</b> :
                ${API.currentStatus}
            </div>
        `)
    );

    contact = {};
    contact.Id = 0;
    contact.Name = "";
    contact.Phone = "";
    contact.Email = "";
    return contact;
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
            <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
        </div>
    `);
    $('#loginCmd').on('click', renderLoginForm);
    initFormValidation(); // important do to after all html injection!
    initImageUploaders();
    $('#abortCmd').on('click', renderLoginForm);
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
function renderEditProfilForm() {
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
                <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
            </div>

            <div class="cancel">
                <hr>
                <a href="confirmDeleteProfil.php">
                    <button class="form-control btn-warning">Effacer le compte</button>
                </a>
            </div>
        `);
        initFormValidation(); // important do to after all html injection!
        initImageUploaders();
        addConflictValidation(API.checkConflictURL(), 'Email', 'saveUser');
        $('#abortCmd').on('click', renderPhotos);
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
function renderLoginForm() {
    eraseContent();
    UpdateHeader("Connexion", "Login");
    $("#newPhotoCmd").hide();
    $("#content").append(`
        <div class="content">
            <h3>${loginMessage}</h3>
            <form class="form" id="loginForm">
                <input  type='email' 
                        name='Email'
                        class="form-control"
                        required
                        RequireMessage = 'Veuillez entrer votre courriel'
                        InvalidMessage = 'Courriel invalide';
                        placeholder="adresse de courriel"
                        value=${Email} > 
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