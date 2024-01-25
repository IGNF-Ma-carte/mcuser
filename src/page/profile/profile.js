import api from  'mcutils/api/api';
import ol_ext_element from 'ol-ext/util/element';
import dialog from 'mcutils/dialog/dialog';
import InputMedia from 'mcutils/control/InputMedia';
import md2html from 'mcutils/md/md2html'
import MDEditor from 'mcutils/md/MDEditor';
import _T from 'mcutils/i18n/i18n';
import { getUserURL, encodeTitleURL } from 'mcutils/api/serviceURL';

import charte from 'mcutils/charte/charte';
import * as coverDefaultUrl from '../../../img/default_cover.png';
import * as profileDefaultUrl from '../../../img/default_user.png';
import serviceURL from 'mcutils/api/serviceURL';

import profileHtml from './profile-page.html';
import editProfileHtml from './edit-profile-page.html';
import editPasswordHtml from './edit-password-page.html';
import editPublicHtml from './edit-public-page.html';
import './profile.css';

let profileDiv = document.querySelector('#page-profil');
profileDiv.innerHTML = profileHtml;


let user;
api.on('me', (e) => {
    user = e.user;
    if (!user) return;

    //un prof ou un eleve n'a pas d'information de connexion connues
    if( user.roles.includes('ROLE_EDUGEO_PROF') 
        || user.roles.includes('ROLE_EDUGEO_ELEVE') 
    ){
        profileDiv.querySelector('.teaser-account').classList.add('hide');
        profileDiv.querySelector('.edit-public').classList.add('hide');
    }else{
        profileDiv.querySelector('.teaser-account').classList.remove('hide');
        profileDiv.querySelector('.teaser-account').classList.remove('hide');
    }

    displayUser(user, profileDiv);
})

/* ********************* */
/*    ID DE CONNEXION    */
/* ********************* */

profileDiv.querySelector('.edit-profile').addEventListener('click', (e) => {
    dialog.show({
        content: editProfileHtml,
        title: 'Modifier mes données',
        className: 'profile',
        buttons: { submit: 'Valider', cancel: 'Annuler'},
        onButton: (click,inputs) => {
            switch(click){
                case 'submit':
                    let form = dialog.getContentElement();
                    let data = checkProfileForm(form, inputs);
                    
                    if(data){
                        api.updateMe(data, (response) => {
                            if(response.error){
                                treatApiError(response, form);
                                return;
                            }
                            user = response;
                            displayUser(user, profileDiv);
                            dialog.close();
                            editSuccess();
                        })
                    }
                    break;
                case 'cancel':
                    break;
            }
        },
    });
    charte.setInputPlaceholder(dialog.getContentElement());
})

function checkProfileForm(form, inputs){
    removeErrors(form);
    const data = {};
    form.querySelectorAll('[data-attr]').forEach( (input) => {
        if(input.value){
            data[input.dataset.attr] = input.value;
        }
    });

    let errorElt = form.querySelector('.error');

    if( !('username' in data) && !('email' in data) ){
        //pas de données à envoyer
        inputs.username.classList.add('invalid');
        inputs.username.focus();
        inputs.email.classList.add('invalid');
        errorElt.classList.remove('hide');
        errorElt.innerText = 'Renseignez le nouveau nom et/ou le nouvel email';
        return null;
    }

    if(data.username && data.username !== data.username.trim() ){
        inputs.username.classList.add('invalid');
        inputs.username.focus;
        errorElt.classList.remove('hide');
        errorElt.innerText = "Le nom ne doit pas commencer ou finir par un espace";
        return null;
    }

    if(('email' in data) && !validateEmail(data.email)){
        //le mail n'est pas valide
        errorElt.innerText = "L'email renseigné n'est pas valide";
        errorElt.classList.remove('hide');
        inputs.email.classList.add('invalid');
        inputs.email.focus();
        return null;
    }

    if(!('current_password' in data)){
        //le mot de passe est obligatoire
        inputs.current_password.classList.add('invalid');
        inputs.current_password.focus();
        errorElt.classList.remove('hide');
        errorElt.innerText = 'Veuillez renseigner le mot de passe';
        return null;
    }

    return data;
}

/* ******************** */
/* NOUVEAU MOT DE PASSE */
/* ******************** */
profileDiv.querySelector('.edit-password').addEventListener('click', (e) => {
    dialog.show({
        content: editPasswordHtml,
        title: 'Modifier mon mot de passe',
        className: 'profile',
        buttons: { submit: 'Valider', cancel: 'Annuler'},
        onButton: (click, inputs) => {
            switch(click){
                case 'submit':
                    let form = dialog.getContentElement();
                    let data = checkPasswordForm(form, inputs);
                    
                    if(data){
                        api.updateMe(data, (response) => {
                            if(response.error){
                                treatApiError(response, form);
                                return;
                            }
                            user = response;
                            displayUser(user, profileDiv);
                            editSuccess();
                        })
                    }
                    break;
                case 'cancel':
                    break;
            }
        }
    });
    charte.setInputPlaceholder(dialog.getContentElement());
})

function checkPasswordForm(form, inputs){
    removeErrors(form);
    const data = {};
    form.querySelectorAll('[data-attr]').forEach( (input) => {
        if(input.value){
            data[input.dataset.attr] = input.value;
        }
    });
    let errorElt = form.querySelector('.error');

    if( !('current_password' in data) ){
        //le mot de passe est obligatoire
        inputs.current_password.classList.add('invalid');
        inputs.current_password.focus();
        errorElt.classList.remove('hide');
        errorElt.innerText = 'Veuillez renseigner le mot de passe';
        return null;
    }
    if( !('new_password' in data) ){
        //le nouveau mot de passe est obligatoire
        inputs.new_password.classList.add('invalid');
        inputs.new_password.focus();
        errorElt.classList.remove('hide');
        errorElt.innerText = 'Veuillez renseigner le nouveau mot de passe';
        return null;
    }
    if( !('new_password_repeat' in data) ){
        //le nouveau mot de passe est obligatoire
        inputs.new_password_repeat.classList.add('invalid');
        inputs.new_password_repeat.focus();
        errorElt.classList.remove('hide');
        errorElt.innerText = 'Veuillez répéter le nouveau mot de passe';
        return null;
    }
    if( data.new_password_repeat != data.new_password ){
        //les nouveaux mots de passe ne sont pas identiques
        inputs.new_password.classList.add('invalid');
        inputs.new_password.focus();
        errorElt.classList.remove('hide');
        errorElt.innerText = 'Les nouveaux mots de passe ne sont pas identiques';
        return null;
    }

    return data;
}

/* ******************** */
/*    PROFIL PULBLIC    */
/* ******************** */

profileDiv.querySelector('.edit-public').addEventListener('click', (e) => {
    dialog.show({
        content: editPublicHtml,
        title: 'Modifier mon profil public',
        className: 'profile',
        buttons: { submit: 'Valider', cancel: 'Annuler'},
        onButton: (click, inputs) => {
            switch(click){
                case 'submit':
                    let form = dialog.getContentElement();
                    let data = checkPublicForm(form, inputs);
                    if(data){
                        api.updateMe(data, (response) => {
                            if(response.error){
                                treatApiError(response, form);
                                return;
                            }
                            user = response;
                            editSuccess();
                        })
                    }
                    dialog.close();
                    break;
                case 'cancel':
                    break;
            }
        }
    });
    displayUser(user, dialog.getContentElement());
    charte.setInputPlaceholder(dialog.getContentElement());
    new InputMedia({ 
        thumb: false,
        add: true,
        input: dialog.getContentElement().querySelector('[data-attr="profile_picture"]'),
        fullpath: true,
    });
    new InputMedia({ 
        thumb: false,
        add: true,
        input: dialog.getContentElement().querySelector('[data-attr="cover_picture"]'),
        fullpath: true,
    });
    new MDEditor({
        input: dialog.getContentElement().querySelector('[data-attr="presentation"]'),
        data: user.presentation,
        output: dialog.getContentElement().querySelector('.presentation-view')
    })
      
});

function checkPublicForm(form, inputs){
    removeErrors(form);
    const data = {};
    form.querySelectorAll('[data-attr]').forEach( (input) => {
        data[input.dataset.attr] = input.value;
    });

    let errorElt = form.querySelector('.error');

    if(data.public_name == '' ){
        // ne peut pas etre nul
        inputs.public_name.classList.add('invalid');
        inputs.public_name.focus();
        errorElt.classList.remove('hide');
        errorElt.innerText = 'Le nom public ne doit pas etre vide';
        return null;
    }

    return data;
}

/* ******************** */
/*  VOIR PROFIL PUBLIC  */
/* ******************** */

profileDiv.querySelector('.show-public').addEventListener('click', (e) => {
    const publicName = encodeTitleURL(user.public_name);
    window.open(getUserURL(publicName + '_' + user.public_id));
})

function displayUser(user, domElement){
    let dataElements = {};
    domElement.querySelectorAll('[data-attr]').forEach(i => {
        dataElements[i.dataset.attr] = i;
    });

    for(let i in dataElements){
        let elt = dataElements[i];
        let attribute = elt.dataset.attr;
        let value = user[attribute];
        
        if(elt.tagName == 'INPUT' || elt.tagName == "TEXTAREA"){
            elt.value = value;
            continue;
        }

        elt.innerText = '';
        switch(attribute){
            case 'presentation':
                md2html.element(value, elt);
                break;
            case 'cover_picture':
                if(!value){
                    // elt.style.backgroundImage = "url('"+ coverDefaultUrl.default +"')";
                    ol_ext_element.create('IMG', {
                        src : coverDefaultUrl.default,
                        parent : elt,
                    });
                    break;
                }
                // elt.style.backgroundImage = "url('"+ value +"')";
                ol_ext_element.create('IMG', {
                    src : value,
                    parent : elt,
                });
                break;
            case 'profile_picture':
                if(!value){
                    // elt.style.backgroundImage = "url('"+ profileDefaultUrl.default +"')";
                    ol_ext_element.create('IMG', {
                        src : profileDefaultUrl.default,
                        parent : elt,
                    });
                    break;
                }
                // elt.style.backgroundImage = "url('"+ value +"')";
                ol_ext_element.create('IMG', {
                    src : value,
                    parent : elt,
                });

                break;
            default:
                elt.innerText = value;
        }
    }
}

function removeErrors(form){
    form.querySelectorAll('[data-attr].invalid').forEach( (input) => {
        input.classList.remove('invalid');
    })
    form.querySelector('.error').innerText = "";
    form.querySelector('.error').classList.add('hide');
}


function treatApiError(response, form){
    removeErrors(form);

    let message = response.xhttp.response;
    if(message.includes('password')){
        form.querySelector('.error').innerText = "Le mot de passe n'est pas correct";
        form.querySelector('.error').classList.remove('hide');
        form.querySelector('[data-attr="current_password"]').classList.add('invalid');
        form.querySelector('[data-attr="current_password"]').focus();
        return;
    }
    if(message.includes('username')){
        form.querySelector('.error').innerText = "Ce nom d'utilisateur est déjà utilisé";
        form.querySelector('.error').classList.remove('hide');
        form.querySelector('[data-attr="username"]').classList.add('invalid');
        form.querySelector('[data-attr="username"]').focus();
        return;
    }
    if(message.includes('email')){
        form.querySelector('.error').innerText = "Cette adresse mail est déjà utilisée";
        form.querySelector('.error').classList.remove('hide');
        form.querySelector('[data-attr="email"]').classList.add('invalid');
        form.querySelector('[data-attr="email"]').focus();
        return;
    }
    if(message.includes('public_name')){
        form.querySelector('.error').innerText = "Ce nom public est déjà utilisée";
        form.querySelector('.error').classList.remove('hide');
        form.querySelector('[data-attr="public_name"]').classList.add('invalid');
        form.querySelector('[data-attr="public_name"]').focus();
        return;
    }
}

function editSuccess(){
    dialog.show({
        title: "Réussite",
        content: 'Les modifications ont été enregistrées',
        className: 'profile',
        buttons: { submit: "OK"},
        hideOnClick: true,
        onButton: (click) => {
            dialog.close();
        }
    })
    setTimeout(() => {
        dialog.close();
    }, 2000);
}

const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
}