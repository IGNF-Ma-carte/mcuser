import ListCarte from 'mcutils/api/ListCarte';
import api from 'mcutils/api/api';
import ol_ext_element from 'ol-ext/util/element';
import { getViewerURL, getEditorURL } from 'mcutils/api/serviceURL';
import { getMapDetails } from '../mapDetails/mapDetails';
import dialog from 'mcutils/dialog/dialog';
import serviceURL from 'mcutils/api/serviceURL';

import mapsHtml from './maps-page.html';
import actionsHtml from './actions-page.html';
import createMapHtml from './create-map-page.html';

import './maps.css';

const mapsElt = document.getElementById('page-cartes');
mapsElt.innerHTML = mapsHtml;

const list = new ListCarte(api, {
    context: 'profile',
    organization: 'out',
    search: true,
    selection: true,
    check: true,
    target: mapsElt.querySelector('.map-result')
});

// lance la recherche à la connexion/deconnexion
api.on('me', () => {
    list.search();
})

mapsElt.querySelector('button.create-map').addEventListener('click', (e) => {
    dialog.show({
        title: 'Créer une carte',
        content: createMapHtml,
        className: 'choose-map-type',
        buttons: {cancel: 'OK'}
    });
    document.querySelectorAll('.ol-ext-dialog.choose-map-type button').forEach( (button) => {
        button.addEventListener('click', (e) => {
            let type = e.target.dataset.type;
            switch(type){
                case 'macarte':
                    window.open(serviceURL.macarte);
                    break;
                case 'mesadresses':
                    window.open(serviceURL.geocod);
                    break;
                case 'storymap':
                    window.open(serviceURL.narration);
                    break;
                case 'statistic':
                    window.open(serviceURL.mestat);
                    break;
            }
        })
    })
})

/********************************/
/* ACTIONS SUR UNE UNIQUE CARTE */
/********************************/
list.on('draw:item', (e) => {

    const opt = ol_ext_element.create('DIV', {
        parent: e.element,
        className: 'li-actions',
    });
    ol_ext_element.create('SPAN', {
        html: 'Voir',
        click: () => {
            window.open(getViewerURL(e.item), '_blank')
        },
        parent: opt,
        title : 'Voir la carte',
    });
    ol_ext_element.create('SPAN', {
        html: 'Modifier',
        click: () => {
            window.open(getEditorURL(e.item), '_blank')
        },
        parent: opt,
        title : 'Modifier la carte',
    });
    ol_ext_element.create('SPAN', {
        html: 'Détails',
        click: () => {
            document.body.dataset.mode = "maps-detail";
            window.scrollTo(0, 0);
            getMapDetails(e.item.view_id);
        },
        parent: opt,
        title : 'Voir les détails de la carte',
    });
});

list.search();

/***************************************/
/* ACTIONS SUR UNE SELECTION DE CARTES */
/***************************************/
list.on('search', (e) => {
    let actionsDiv = mapsElt.querySelector('.map-result .actions');
    if(actionsDiv){
        // empeche la réplication de la div .actions lors de la déconnexion/reconnexion
        return;
    }
    
    actionsDiv = ol_ext_element.create('DIV', {
        parent: list.element.querySelector('.mc-search'),
        html: actionsHtml,
        class: 'actions'
    });

    // Disable button when no check
    list.on(['check', 'check:all', 'draw:list'], () => {
        let actionsDiv = mapsElt.querySelector('.map-result .actions');
        const btn = actionsDiv.querySelectorAll('button.select')
        if (list.getChecked().length) {
            btn.forEach(b => b.classList.remove('button-disabled'))
        } else {
            btn.forEach(b => b.classList.add('button-disabled'))
        }
    });

    // sélection multiple de cartes
    list.on('check', (e) => {
        updateCheckedMaps(list, actionsDiv);
    });

    // clik sur checkbox
    list.element.querySelector('.mc-search .actions .checked-maps input').addEventListener('click', (e) => {
        toogleSelectAllMaps(e, list, actionsDiv);
    });

    // modifier le theme
    list.element.querySelector('.mc-search .actions .edit-theme').addEventListener('click', (e) => {
        editTheme(list);
    });

    // modifier le partage
    list.element.querySelector('.mc-search .actions .edit-share').addEventListener('click', (e) => {
        editShare(list);
    });

    // supprimer les cartes
    list.element.querySelector('.mc-search .actions .delete-maps').addEventListener('click', (e) => {
        deleteMapsDialog(list);
    });
})

// réinitialise l'affichage des cartes checked
list.on(['search', 'change:page' ], (e) => {
    let actionsDiv = mapsElt.querySelector('.map-result .actions');
    list.checkAll(false);
    updateCheckedMaps(list, actionsDiv);
})

// ajout/retrait d'une carte checked
function updateCheckedMaps(list, elt){
    elt.querySelector('.checked-maps .count').innerText = list.getChecked().length;
    elt.querySelector('.checked-maps input').checked = list.getChecked().length > 0;
}

function toogleSelectAllMaps(event, list, elt){
    if (event.currentTarget.checked) {
        //check toutes les cartes
        list.checkAll(true);
    } else {
        //uncheck toutes les cartes
        list.checkAll(false);
    }
    elt.querySelector('.checked-maps .count').innerText = list.getChecked().length;
}

function editTheme(list){
    if(!hasCheckedMaps(list)){
        return;
    }

    api.getThemes((themes) => {
        let content = ol_ext_element.create('DIV');
        ol_ext_element.create('P',{
            text: 'Sélectionnez le thème qui sera appliqué aux ' + list.getChecked().length + ' carte(s) sélectionnée(s) puis cliquez sur Enregitstrer',
            parent: content
        });

        let options = {};
        for(let i in themes){
            options[themes[i]['name']] = themes[i]['id'];
        }
        ol_ext_element.create('SELECT', {
            options: options,
            parent: content,
            className: 'theme'
        })

        dialog.show({
            title: "Gérer le thème",
            content: content,
            className: 'edit-theme',
            buttons: {submit : 'Valider', cancel: 'Annuler'},
            onButton: (click, inputs) => {
                switch (click){
                    case 'submit':
                        updateMaps(list.getChecked(), 'theme_id', parseInt(inputs.theme.value))
                        break;
                    case 'cancel':
                        break;
                }
            }
        })
    })
}

function editShare(list){
    if(!hasCheckedMaps(list)){
        return;
    }

    let content = "<p>Indiquez si vous souhaitez ajouter les " + list.getChecked().length + " cartes dans l'atlas<p>"
        +   "<p class='label'>Publication dans l'atlas</p>"
        +   "<p>"
        +       '<label class="ol-ext-check ol-ext-radio"><input type="radio" name="radio" class="atlas" value="atlas" checked><span></span>Oui</label>'
        +       '<label class="ol-ext-check ol-ext-radio"><input type="radio" name="radio" class="private" value="private"><span></span>Non</label>'
        +   '</p>'
    ;
    dialog.show({
        title: "Gérer la publication",
        content: content,
        className: 'edit-share',
        buttons: {submit : 'Valider', cancel: 'Annuler'},
            onButton: (click, inputs) => {
                switch (click){
                    case 'submit':
                        let value = 'private';
                        if(inputs['atlas'].checked){
                            value = "atlas";
                        }
                        updateMaps(list.getChecked(), 'share', value);
                        break;
                    case 'cancel':
                        break;
                }
            }
    })
}


/**
 * 
 * @param {Array<Story|Carte>} maps 
 */
function updateMaps(maps, attr, value, max){
    if (maps.length) {
        if (!max){
            //à l'envoi de la 1re carte, pour l'affichage de la patience
            max = maps.length;
        }

        const map = maps.pop();
        dialog.show('Modification en cours...');
        dialog.setProgress(max - maps.length, max);
        
        let data = {};
        data[attr] = value;

        api.updateMap(map.edit_id, data, (e) => {
            updateMaps(maps, attr, value, max);
        })
    } else {
        dialog.hide();
        list.search();
    }
}


/***** delete maps **********/
function deleteMapsDialog(list){
    if(!hasCheckedMaps(list)){
        return;
    }
    dialog.show({
        title: 'Supprimer la sélection',
        content: 'Etes-vous sûr de vouloir supprimer définitivement ces '+ list.getChecked().length+' carte(s)',
        buttons: { submit: 'Valider', cancel: 'Annuler'},
        onButton: (click) => {
            switch(click){
                case 'submit':
                    deleteMaps(list.getChecked());
                    break;
                case 'cancel':
                    break;
            }
        }
    });
}

function deleteMaps(maps, max){
    if (maps.length) {
        if (!max){
            //à la suppression de la 1re carte, pour l'affichage de la patience
            max = maps.length;
        }

        const map = maps.pop();
        dialog.show('Suppression en cours...');
        dialog.setProgress(max - maps.length, max);
        
        api.deleteMap(map.edit_id, (e) => {
            deleteMaps(maps, max);
        });
    }else{
        dialog.hide();
        list.search();
    }
}

function hasCheckedMaps(list){
    if(list.getChecked().length === 0){
        dialog.show({
            content: "Sélectionnez au moins une carte",
            buttons: {close: "OK"},
            closeOnSubmit: true,
            autoclose: 2000,
        });
        return false;
    }

    return true;
}

function listSearch(){
    list.search()
}

export { listSearch }