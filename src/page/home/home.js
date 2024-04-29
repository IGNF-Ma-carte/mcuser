import serviceURL from 'mcutils/api/serviceURL'

import homeHtml from './home-page.html';
import './home.css';


const home = document.getElementById('page-accueil');
home.innerHTML = homeHtml;

// Equipe
const teamLink = home.querySelector('[data-ref="equipes"] a')
teamLink.href = serviceURL.mesequipes

// Click on blocks
home.querySelectorAll('[data-role="teaser-2"] > div').forEach((div) => {
    div.addEventListener('click', () => {
        //document.location.hash = div.dataset.ref;
        div.querySelector('a').click()
    })
});
