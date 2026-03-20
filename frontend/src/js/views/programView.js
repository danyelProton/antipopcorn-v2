import View from './view.js';

class ProgramView extends View {
  parentEl = document.querySelector('.program');
  errMsg = 'Toto nevyšlo. Nevadí, taký je futbal. Skús refresh.';
  

  addHandlerRenderCinemaProgram(handler) {
    window.addEventListener('load', handler);
  }

  addHandlerRenderAnotherPage(handler) {
    this.parentEl.addEventListener('click', function(e) {
      const btn = document.querySelector('.load-more');
      if (e.target !== btn || btn.classList.contains('load-more-end')) return;
      handler();
    });
  }

  renderNoResults() {
    const markup = `
    <div class="no-results-box">
      <p class="no-results__msg">Nič, prázdnota...</p>
    </div>
  `;
  this.clear();
  this.parentEl.insertAdjacentHTML('beforeend', markup);
  }

  generateMarkup() {
    const programMarkup = this.data.map((mov, i) => {
      return `
        <article class="movie${i === 0 ? ' first' : ''}${i === this.data.length - 1 ? ' last' : ''}" data-movie-url="${mov.url}" data-cinema="${mov.cinemaShort}" data-id="${mov.id}">
          <button class="movie__overview" aria-expanded="false">
            <div class="movie__overview-box container-inner">
              <div class="overview__date-box">
                <span class="date__date">${mov.day}</span>
                <span class="date__month">${mov.month}</span>
              </div>
              <div class="overview__title-box">
                <span class="title__time"><strong>${mov.time}</strong> &vert; ${mov.weekday}</span>
                <h2 class="title__title">${mov.title}</h2>
              </div>  
              <span class="overview__cinema">${mov.cinema}</span>
              <div class="overview__arrow">
                <svg class="arrow__icon">
                  <use href="#arrow"></use>
                </svg>
              </div>
            </div>
          </button>
          <section class="movie__details"></section>
        </article>
      `;
    }).join('');
    return programMarkup;
  }
}

export default new ProgramView();