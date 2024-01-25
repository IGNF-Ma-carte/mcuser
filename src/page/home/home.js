import homeHtml from './home-page.html';
import './home.css';


const home = document.getElementById('page-accueil');
home.innerHTML = homeHtml;

home.querySelectorAll('[data-role="teaser-3"] > div').forEach((div) => {
    div.addEventListener('click', () => {
        document.location.hash = div.dataset.ref;
    })
});