// import './localhostapi' ;
import './mcversion'
import config from 'mcutils/config/config';
import charte from  'mcutils/charte/macarte';
import api from  'mcutils/api/api';
import {connectDialog} from 'mcutils/charte/macarte';
import 'mcutils/fonts/font-awesome.min.css';

import './page/home/home.js';
import './page/maps/maps.js';
import './page/medias/medias.js';
import './page/profile/profile.js';
import './page/mapDetails/mapDetails.js';

import './index.css';

charte.setApp('compte', 'Ma carte');

function setPage(){
    // les pages affichées sont en fonction des # (ex : macarte.ign.fr/moncompte/#mescartes)
    document.body.dataset.show = document.location.hash.substring(1) || "accueil";
    window.scrollTo(0, 0);
    switch(document.body.dataset.show){
        case 'profil':
            charte.setAppMenu('mesinfo');
            break;
        case 'cartes':
            charte.setAppMenu('mescartes');
            break;
        case 'medias':
            charte.setAppMenu('mesimages');
            break;
        default:
            charte.setAppMenu('moncompte');
    }
    delete document.body.dataset.mode;
}
window.addEventListener("hashchange", setPage, false);

document.querySelectorAll(".breadcrumb .link-macarte").forEach( (a) => {
    a.setAttribute('href', config.server);
})

setPage();
charte.setInputPlaceholder();

// Not connected
if (!api.isConnected()) {
    connectDialog()
}
// Display connection button
setTimeout(() => {
    const bt = document.querySelector('[data-role="content"] .disconnected .connect')
    bt.classList.add('active');
    bt.addEventListener('click', () => {
        connectDialog();
    })
}, 1000)

/* DEBUG */
window.charte = charte;
window.api = api
