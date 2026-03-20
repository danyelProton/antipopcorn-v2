import errorView from './errorView.js';

export default class View {
  data;

  render(data) {
    this.data = data;
    const markup = this.generateMarkup();
    // console.log(this.parentEl);
    this.parentEl.insertAdjacentHTML('beforeend', markup);
  }

  clear() {
    this.parentEl.innerHTML = '';
  }

  // load more button
  renderLoadMore() {
    const markup = `
      <button class="load-more">ďalšie...</button>
    `;
  // this.clear();
    this.parentEl.insertAdjacentHTML('beforeend', markup);
  }

  // 'load more' button when last page (no more results)
  renderLastPage() {
    const markup = `
      <button class="load-more load-more-end">všetko má svoj koniec...</button>
    `;
    this.parentEl.insertAdjacentHTML('beforeend', markup);
  }

  // 'loading' animation
  renderLoader() {
    const markup = `
      <div class="loader-box">
        <div class="loader"></div>
      </div>
    `;
    // this.clear();
    this.parentEl.insertAdjacentHTML('beforeend', markup);
  }

  // error message
  renderError(movieUrl = null) {
    const markup = errorView.generateMarkup.call(this, movieUrl);

    this.clear();
    this.parentEl.insertAdjacentHTML('beforeend', markup);
  }
}