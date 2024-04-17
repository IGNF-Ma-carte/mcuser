import serviceURL from 'mcutils/api/serviceURL'

import homeHtml from './home-page.html';
import './home.css';


const home = document.getElementById('page-accueil');
home.innerHTML = homeHtml;

// Organizations
const orgaLink = home.querySelector('[data-ref="organisations"] a')
orgaLink.href = serviceURL.mesorganizations

// Click on blocks
home.querySelectorAll('[data-role="teaser-2"] > div').forEach((div) => {
    div.addEventListener('click', () => {
        //document.location.hash = div.dataset.ref;
        div.querySelector('a').click()
    })
});
