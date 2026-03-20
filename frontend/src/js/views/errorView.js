class ErrorView {
  parentEl = document.querySelector('.program');


  addHandlerRefresh(handler) {
    this.parentEl.addEventListener('click', async function(e) {
      // console.log(e.target);
      const refreshBtn = e.target.closest('.error__reload');
      if (!refreshBtn) return;
      const movie = e.target.closest('.movie');

      movie ? await handler(movie) : location.reload();
    });
  }

  generateMarkup(movieUrl = null) {
    return `
      <div class="error-box">
        <p class="error__msg">${this.errMsg}${movieUrl ? ` Alebo tu je <a class="error__link" href="${movieUrl}" target="_blank">web filmu</a>.` : ''}</p>
        <button class="error__reload">
          <svg class="icon icon-reload">
            <use href="#reload"></use>
          </svg>
        </button>
      </div>
    `;
  }
}

export default new ErrorView();