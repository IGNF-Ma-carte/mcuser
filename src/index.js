// import './localhostapi' ;
import './mcversion'
import api from  'mcutils/api/api';
import charte from  'mcutils/charte/macarte';
import {connectDialog} from 'mcutils/charte/macarte';
import config from 'mcutils/config/config';
import 'mcutils/fonts/font-awesome.min.css';

import './index.css';
import './page/home/home.js';
import './page/maps/maps.js';
import './page/medias/medias.js';
import './page/profile/profile.js';
import './page/mapDetails/mapDetails.js';

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

window.charte = charte;
charte.setApp('compte', 'Ma carte');
setPage();
charte.setInputPlaceholder();

// Listen to menu / title click
charte.on(['header:menu', 'header:mega', 'header:title'], console.log);
charte.on(['header:list'], console.log);
charte.on(['menu:list'], console.log);


if(!api.isConnected()){
    connectDialog( 
        (e) => {
            document.body.dataset.connected = "";
        } 
    )
}


api.on('logout', (e) => {
    delete document.body.dataset.connected;
})

