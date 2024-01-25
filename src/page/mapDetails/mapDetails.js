import api from  'mcutils/api/api';
import ol_ext_element from 'ol-ext/util/element';
import { getViewerURL, getEditorURL } from 'mcutils/api/serviceURL';
import saveCarte from 'mcutils/dialog/saveCarte'
import dialog from 'mcutils/dialog/dialog';
import shareCarte from 'mcutils/dialog/shareCarte';

import { listSearch } from '../maps/maps.js';

import mapDetailsHtml from './mapDetails-page.html';
import './mapDetails.scss';

const mapDetailsElt = document.getElementById('page-maps-detail');
mapDetailsElt.innerHTML = mapDetailsHtml;

let map;

// comportement au click sur le breadcrumb
mapDetailsElt.querySelectorAll('.breadcrumb a').forEach((a) => {
    a.addEventListener('click', () => {
        delete document.body.dataset.mode;
    });
});

// liste des éléments où afficher les attributs de la carte
const dataAttributes = {};
mapDetailsElt.querySelectorAll('[data-attr]').forEach(i => {
    dataAttributes[i.dataset.attr] = i;
});



/********************/
/* BOUTONS D'ACTION */
/********************/

//click sur le bouton "modifier les informations"
mapDetailsElt.querySelector('.actions button.edit').addEventListener('click', (e) => {
    saveCarte(map, (editedMap) => {
        api.updateMap(editedMap.edit_id, editedMap, (response) => {
            displayMap(response);
            dialog.show({
                content: "Les modifications ont été enregistrées",
                buttons: {close: "OK"},
                closeOnSubmit: true,
                autoclose: 2000,
            });
        });
    });
});

// click sur le bouton "modifier la carte"
mapDetailsElt.querySelector('.actions button.edit-data').addEventListener('click', (e) => {
    window.open(getEditorURL(map), '_blank');
});

// click sur le bouton "supprimer la carte"
mapDetailsElt.querySelector('.actions button.delete').addEventListener('click', (e) => {
    dialog.show({
        content: 'Etes-vous sûr de vouloir supprimer définitivement cette carte',
        buttons: { submit: 'Valider', cancel: 'Annuler'},
        onButton: (click) => {
            switch(click){
                case 'submit':
                    dialog.showWait('Suppression en cours...');
                    api.deleteMap(map.edit_id, (e) => {
                        delete document.body.dataset.mode;
                        listSearch();
                        dialog.hide();
                    });
                    break;
            }
        }
    });
});

// click sur le bouton "modifier le lien de modification"
mapDetailsElt.querySelector('button.new-id_edit').addEventListener('click', (e) => {
    api.updateMap(map.edit_id, {new_edit_id : true}, (response) => {
        map = response;
        displayMap(response);
    })
});

mapDetailsElt.querySelector('[data-attr="share"]').addEventListener('click', evt => {
    const share = evt.target.checked ? 'atlas' : 'private';

    api.updateMap(map.edit_id, {share : share}, (response) => {
        let msg = '';
        if(response.error){
            // on revient à l'état précédent
            evt.target.checked = !evt.target.checked;
            msg = 'Une erreur est survenue';
        }else{
            map = response;
            if(map.share == 'private'){
                msg = "la carte est retirée de l'atlas";
            }else{
                msg = "la carte est ajoutée dans l'atlas";
            }
        }

        dialog.show({
            content: msg,
            buttons: {close: "OK"},
            closeOnSubmit: true,
            autoclose: 2000,
        });
    });
});

mapDetailsElt.querySelector('[data-attr="active"]').addEventListener('click', evt => {
    api.updateMap(map.edit_id, {active : evt.target.checked}, (response) => {
        let msg = '';
        if(response.error){
            // on revient à l'état précédent
            evt.target.checked = !evt.target.checked;
            msg = 'Une erreur est survenue';
        }else{
            map = response;
            if(map.active){
                msg = 'la carte est active';
            }else{
                msg = 'la carte est inactive';
            }
        }

        dialog.show({
            content: msg,
            buttons: {close: "OK"},
            closeOnSubmit: true,
            autoclose: 2000,
        });

    });
});

// met à jour l'affichage de la carte à afficher
function displayMap(map){
    if(map.valid){
        mapDetailsElt.querySelector('.invalid').classList.add('hide')
    }else{
        mapDetailsElt.querySelector('.invalid').classList.remove('hide')
    }
    for(let i in dataAttributes){
        let elt = dataAttributes[i];
        let attribute = elt.dataset.attr;
        let value = map[attribute];
        elt.innerText = '';

        switch(attribute){
            case 'active':
                elt.checked = value;
                break;
            case 'share':
                elt.checked = true;
                if(map.share == 'private'){
                    elt.checked = false;
                }
                break
            case 'updated_at':
            case 'created_at':
                let date = new Date(value);
                elt.innerText = date.toLocaleString('fr-FR');
                break;
            case 'img_url':
                if(value){
                    ol_ext_element.create('img', {
                        parent: elt,
                        src: value
                    });
                }
                break;
            case 'view-link':
                ol_ext_element.create('a', {
                    parent: elt,
                    href: getViewerURL(map),
                    text: getViewerURL(map),
                    target: '_blank',
                });
                break;
            case 'edit-link':
                ol_ext_element.create('a', {
                    parent: elt,
                    href: getEditorURL(map),
                    text: getEditorURL(map),
                    target: '_blank',
                });
                break;
            case 'view':
                ol_ext_element.create('IFRAME', {
                    parent: elt,
                    src: getViewerURL(map),
                });
                break;
            case "description":
                if(value){
                    elt.innerText = value;
                }else{
                    elt.innerHTML = '<i>Pas de description enregistrée</i>';
                }
                break;
            default:
                elt.innerText = value;
        }
    }
}

function getMapDetails(id){
    api.getMap(id, (newMap) => {
        map = newMap;
        displayMap(map);
        shareCarte({
            target : mapDetailsElt.querySelector('.partage'),
            title : map.title,
            url: getViewerURL(map),
        })
    });
}

export { getMapDetails };