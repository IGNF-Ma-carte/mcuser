import ListMedias from 'mcutils/api/ListMedias';
import serviceURL from 'mcutils/api/serviceURL';
import api from 'mcutils/api/api';
import ol_ext_element from 'ol-ext/util/element';
import { addMediaDialog, updateMediaDialog } from 'mcutils/dialog/openMedia';
import dialogMessage from 'mcutils/dialog/dialogMessage';
import dialog from 'mcutils/dialog/dialog';

import mediasHtml from './medias-page.html';
import './medias.css'

document.getElementById('page-medias').innerHTML = mediasHtml;

const mediasElt = document.getElementById('page-medias');
mediasElt.innerHTML = mediasHtml;
let mediaSizeLimit;
let mediaSize = 0;
mediasElt.querySelector('a.cgu').setAttribute('href', serviceURL.cgu);
api.on('me', (e) => {
    let user = e.user;
    if (!user) return;
    // mediasElt.querySelector('span.medias_limit_size').innerText = Math.round(user.medias_limit_size * 100) / 100;
    // mediasElt.querySelector('span.medias_size').innerText = Math.round(user.medias_size * 100) / 100;
    mediaSizeLimit = user.medias_limit_size;
    mediaSize = user.medias_size;
    updateProgressBar(mediaSize, mediaSizeLimit);
})

const list = new ListMedias(api, {
    selection: true,
    search: true,
    check: true,
    limit: true,
    target: mediasElt.querySelector('.result-medias')
});

/**
 * Afficher l'espace utilisé Vs espace disponible
 * @param {*} current espace utilisé (en octet)
 * @param {*} max espace disponible de l'espace (en octet)
 */
function updateProgressBar(current, max){
    const elt = mediasElt.querySelector('.used-space');
    elt.querySelector('[data-attr="medias_size"').innerText = Math.round(current*100/1024/1024)/100;
    elt.querySelector('[data-attr="medias_size_limit"').innerText = Math.round(max*100/1024/1024)/100;;
    elt.querySelector('.progress-bar-fill').style.width = (current / max)*100 + "%";
}

// List header element
const listHeader = list.getHeaderElement();

// Disable button when no check
list.on(['check', 'draw:list'], () => {
  const btn = listHeader.querySelectorAll('button.select')
  if (list.getChecked().length) {
    btn.forEach(b => b.classList.remove('button-disabled'))
  } else {
    btn.forEach(b => b.classList.add('button-disabled'))
  }
});

list.on('draw:item', (e) => {
    const opt = ol_ext_element.create('DIV', {
        parent: e.element,
        className: 'li-actions',
    });
    ol_ext_element.create('SPAN', {
        html: 'Modifier',
        click: () => {
            updateMediaDialog({
                media: e.item,
                folders: list.get('folders'),
                callback: () => {
                    list.search();
                }
            })
        },
        parent: opt,
        title : 'Modifier le média',
    });
});

// Bouton et action "ajouter un media"
ol_ext_element.create('BUTTON', {
    className: 'button button-ghost',
    html: '<i class="fa fa-plus-circle fa-fw"></i> Ajouter un média',
    click: () => {
        addMediaDialog({
            callback: (e) => {
                mediaSize += e.item.size;
                updateProgressBar(mediaSize, mediaSizeLimit);

                list.updateFolders();
                if(list.get('folder') === e.item.folder){
                    list.showPage();
                }else{
                    list.setFolder(e.item.folder);
                }
            }
        }, list.get('folders'))
    },
    parent: listHeader
});

// Bouton et action "modifier le dossier des médias sélectionnés"
ol_ext_element.create('BUTTON', {
    className: 'button button-ghost select',
    html: '<i class="fa fa-folder fa-fw"></i> Changer de galerie...',
    click: () => {
        const sel = list.getChecked();
        if (!sel || !sel.length) {
            dialogMessage.showMessage('Sélectionnez des images à changer de dossier...')
            return;
        }
        list.getFolderDialog({
            prompt: 'Ecrire le nom de la galerie ou sélectionner dans la liste :'
        }, (folder) => {
            // Update media recursively
            const updateMedia = (e) => {
            if (e && e.error) {
                dialogMessage.showAlert('Une erreur est survenue !<br/>Impossible de changer de dossier...')
                list.updateFolders();
                list.showPage();
                return;
            }
            // Next selection
            const s = sel.pop()
            if (s) {
                if (s.folder !== folder) api.updateMediaFolder(s.id, folder, updateMedia);
                else updateMedia();
            } else {
                list.updateFolders();
                list.showPage();
            }
            }
            updateMedia();
        });
    },
    parent: listHeader
})
  

// Delete media button
ol_ext_element.create('BUTTON', {
    className: 'button button-accent select',
    html: '<i class="fa fa-trash fa-fw"></i> Supprimer...',
    click: () => {
        const sel = list.getChecked();
        const max = sel.length;
        
        if (!sel || !sel.length) {
            dialogMessage.showMessage('Sélectionnez des images à supprimer...')
            return;
        }
        // Delete media recursively
        const deleteMedia = (e) => {
            if (e && e.error) {
                dialogMessage.showAlert('Une erreur est survenue !<br/>Impossible de supprimer une image...');
                list.showPage(list.get('currentPage'));
                return;
            }
            // Next selection
            const s = sel.pop()
            dialog.show('Suppression en cours...');
            dialog.setProgress(max - sel.length, max);
            if (s) {
                api.deleteMedia(s.id, deleteMedia);
                mediaSize -= s.size;
                updateProgressBar(mediaSize, mediaSizeLimit);
            } else {
                list.updateFolders((folders) => {
                    dialog.hide();
                    if(list.get('folder') && folders.indexOf(list.get('folder')) < 0){
                        list.setFolder()
                    }else{
                        list.showPage(list.get('currentPage'));
                    }
                }); 
            }
        }
        // Ask for delete
        dialogMessage.showAlert(
            'Êtes-vous sûr de vouloir supprimer <b>' + sel.length + '</b> image' + (sel.length > 1 ? 's ?':' ?')
            + '<br/>Une fois supprimées, les images ne s\'afficheront plus sur les cartes.'
            + '<br/><b class="accent">Cette action est irréversible.</b>',
            { ok: 'supprimer', cancel: 'annuler'},
            (b) => {
                if (b==='ok') {
                    deleteMedia();
                }
                dialogMessage.close();
            } 
        )
        // Color button
        dialogMessage.element.querySelector('.ol-buttons input').className = 'button button-accent';
    },
    parent: listHeader
});
  
// list.search();

api.on('me', () => {
    // list.search();
    list.updateFolders();
})