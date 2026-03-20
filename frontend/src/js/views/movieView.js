import View from './view.js';
import fallbackImg from '../../img/fallback-img.png?url';
import { IMG_TIMEOUT_SEC } from '../config.js';

class MovieView extends View {
  parentEl = ''; // movie details box of clicked movie (declared in event listener)
  errMsg = 'Toto nevyšlo. Nevadí, taký je futbal. Skús refresh.';
  program = document.querySelector('.program');
  iframe = document.querySelector('iframe');
  modal = document.querySelector('.modal');
  overlay = document.querySelector('.overlay');
  header = document.querySelector('.header');
  backToTop = document.querySelector('.back-to-top-box');
  footer = document.querySelector('.footer');
  trailerBtn;

  constructor() {
    super();
    this.#showModal();
    this.#closeModalCloseBtn();
    this.#closeModalEscape();
    this.#closeModalOverlayClick();
  }


  addHandlerRenderMovieDetails(handler) {
    this.program.addEventListener('click', async function(e) {
      // console.log(e.target);
      const movieOverview = e.target.closest('.movie__overview');
      
      if (!movieOverview) return;

      const movie = e.target.closest('.movie');
      
      const movieDetailsBox = movie.querySelector('.movie__details');

      // if movie already active, remove active (collapse accordion); else if program details exist (had been already clicked on movie) then handler f without rendering; else render movie details (remove error if there's one)
      if (movie.classList.contains('active')) {
        movie.classList.remove('active');
        movie.querySelector('.movie__overview').setAttribute('aria-expanded', false);
      } else if (movieDetailsBox.firstElementChild && movieDetailsBox.firstElementChild?.className !== 'error-box') {
        await handler(movie, false);
        // console.log(movie);
      } else {
        if (movieDetailsBox.firstElementChild?.className === 'error-box') movieDetailsBox.firstElementChild.remove();
        this.parentEl = movieDetailsBox;
        await handler(movie);
        // console.log(movie);
        // console.log(this.data);
      };
    }.bind(this));
  }


  // render loading component (loader) before img is loaded (img with class hidden until then); load fallback img if original img loading fails
  checkImgLoaded(movie) {
    const img = movie.querySelector('.media__img');
    const height = movie.querySelector('.details__media').getBoundingClientRect().width / 1.7787; // loader in the same size as the image
    const imgMarginBottom = parseFloat(getComputedStyle(img).marginBottom); // plus image margin bottom
    const imgBorderBottom = parseFloat(getComputedStyle(img).borderBottomWidth); // plus border (bottom + top)
    const loaderBox = movie.querySelector('.loader-box');

    loaderBox.style.position = 'relative'; // for css
    loaderBox.style.height = `${height + imgMarginBottom + (2 * imgBorderBottom)}px`;

    let loaded = false;

    const removeLoader = () => {
      img.classList.remove('hidden');
      loaderBox.remove();
      loaderBox.style.removeProperty('position');
      loaded = true;
    };

    img.addEventListener('load', removeLoader, { once: true });

    // if timeout, render fallback img
    setTimeout(() => {
      if (!loaded) {
        removeLoader();
        img.setAttribute('src', fallbackImg);
        img.setAttribute('alt', 'antipopcorn logo');
      };
    }, IMG_TIMEOUT_SEC * 1000);
  }


  generateMarkup() {
    return `
      <div class="movie__details-box container-inner">
        <section class="details__media">
          <div class="loader-box">
            <div class="loader"></div>
          </div>
          <img class="media__img hidden" src="${this.data.image}" alt="${this.data.titleOriginal}">
          ${this.data.youtubeId ? `<button class="media__trailer" data-yt="${this.data.youtubeId}"><span class="trailer-icon"></span>Trailer</button>` : ''}
        </section>

        <section class="details__info">
          <h2 class="info__original-title">${this.data.titleOriginal}</h2>
          ${this.data.language ?
            `<p class="info__language">${this.data.language}</p>` : ''}
          ${this.#generateInfoInvolved()}
          ${this.#generateInfoOther()}
        </section>
      </div>
            
      <section class="details__description container-inner">
        <div class="description__content">
            ${this.data.description}
        </div>
        <ul class="description__links">
          <li>
            <a class="link link__cinema" href="${this.data.url}" target="_blank">WEB KINA</a>
          </li>
          <li>
            <a class="link link__csfd" href="https://www.csfd.sk/hladat/?q=${encodeURIComponent(this.data.titleOriginal)}&series=0&creators=0&users=0" target="_blank">NÁJDI NA ČSFD</a>
          </li>
          <li>
            <a class="link link__letterboxd" href="https://letterboxd.com/search/${encodeURIComponent(this.data.titleOriginal)}/" target="_blank">NÁJDI NA LETTERBOXD</a>
          </li>
          <li>
            <a class="link link__imdb" href="https://www.imdb.com/find/?s=tt&q=${encodeURIComponent(this.data.titleOriginal)}" target="_blank">NÁJDI NA IMDB</a>
          </li>
        </ul>
      </section>

    `
  }


  #generateInfoInvolved() {
    if (this.data.director || this.data.actors) {
      return `
        <dl class="info__involved">
        ${this.data.director ?
          `<div class="involved__director">
            <dt class="director__desc">Réžia</dt>
            <dd class="director__content">${this.data.director}</dd>
          </div>` : ''}
        ${this.data.actors ?
          `<div class="involved__actors">
            <dt class="actors__desc">Hrajú</dt>
            <dd class="actors__content">${this.data.actors}</dd>
          </div>` : ''}
        </dl>
      `
    } else return '';
  }


  #generateInfoOther() {
    if (this.data.year || this.data.length || this.data.genre || this.data.country) {
      return `
        <div class="info__other">
          ${this.#generateInfoOtherValues() ?
          `<span class="other__year-length-genre">${this.#generateInfoOtherValues()}</span>` : ''}
          ${this.data.country ?
          `<span class="other__country">${this.data.country}</span>
        </div>` : ''}
      `
    } else return '';
  }


  #generateInfoOtherValues() {
    const infoOtherArr = [];
    this.data.year ? infoOtherArr[0] = `<strong>${this.data.year}</strong>` : ''; 
    this.data.length ? infoOtherArr[1] = `${this.data.length}` : ''; 
    this.data.genre ? infoOtherArr[2] = `${this.data.genre}` : '';
    return infoOtherArr.length ? infoOtherArr.filter(value => value).join(' | ') : false;
  }


  // when modal opened (used for yt trailer), make rest of the page inaccessible for keyboard and screenreaders
  inert() {
    [this.header, this.program, this.backToTop, this.footer].forEach(el => el.inert = true);
  }


  cancelInert() {
    [this.header, this.program, this.backToTop, this.footer].forEach(el => el.inert = false);
  }


  #showModal() {
    this.program.addEventListener('click', function(e) {
      if (!e.target.classList.contains('media__trailer')) return;
      // console.log(e.target);
      const youtubeId = e.target.dataset.yt;
      // console.log(youtubeId);
      this.iframe.setAttribute('src', `https://www.youtube.com/embed/${youtubeId}`);
      this.modal.classList.remove('hidden');
      this.overlay.classList.remove('hidden');
      this.inert();

      // for focus when modal closed
      this.trailerBtn = document.querySelector('.media__trailer');
      
      // youtube lite library - didn't work
      // document.querySelector('lite-youtube').setAttribute('videoid', youtubeId);
      // console.log(document.querySelector('lite-youtube').getAttribute('videoid'));
    }.bind(this));
  }


  #closeModal() {
    this.iframe.setAttribute('src', 'about:blank');
    // document.querySelector('lite-youtube').setAttribute('videoid', '');;
    this.modal.classList.add('hidden');
    this.overlay.classList.add('hidden');
    this.cancelInert();

    // console.log(this.trailerBtn);
    // focus to trailer btn when modal closed, so keyboard navigtion can continue from this point on
    this.trailerBtn.focus();
  }
 

  #closeModalCloseBtn() {
    document.querySelector('.close-modal-btn').addEventListener('click', this.#closeModal.bind(this));
  }


  #closeModalEscape() {
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) this.#closeModal();
    }.bind(this));      
  }


  #closeModalOverlayClick() {
    this.overlay.addEventListener('click', this.#closeModal.bind(this));
  }
}

export default new MovieView();



// version of details__info with icons
// generateDetailRow() {
//   const detailsArr = [...arguments];
//   return detailsArr.map(row => {
//     return this.data[row] ? `
//       <li class="info info__${row}">
//         <svg class="icon icon-${row}">
//           <use href="img/icons.svg#${row}"></use>
//         </svg>
//         <span>${this.data[row]}</span>
//       </li>
//     ` : '';
//   }).join('');
// }

// pre funkciu generateDetailRow()
// <ul class="details__info">
// <li class="info info__original-title">
//   <span>${this.data.titleOriginal}${this.data.year ? ` (${this.data.year})` : ''}</span>
// </li>

//   ${this.generateDetailRow('director', 'actors', 'country', 'genre', 'length', 'language')}

// </ul>

// play button in media trailer as unicode char (rendered as emoji in iOS)
//<section class="details__media">
//<img class="media__img" src="${this.data.image}" alt="${this.data.titleOriginal}">
//${this.data.youtubeId ? `<button class="media__trailer" data-yt="${this.data.youtubeId}"><span class="trailer-icon">&#9654;</span>Trailer</button>` : ''}
//</section>