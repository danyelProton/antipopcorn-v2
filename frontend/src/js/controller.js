import * as model from './model.js';
import { LUMIERE_ID, FILM_EUROPE_ID, NOSTALGIA_ID, MLADOST_ID, RESULTS_PER_PAGE } from './config.js';
import programView from './views/programView.js';
import movieView from './views/movieView.js';
import errorView from './views/errorView.js';
import filterView from './views/filterView.js';
import scrollView from './views/scrollView.js';
import icons from '../img/icons.svg?raw';
// import 'core-js/actual';
// import 'regenerator-runtime/runtime';


// insert icons into DOM using ?raw import (they are not displayed)
document.body.insertAdjacentHTML('afterbegin', icons);

const controlCinemaProgram = async function() {
  try {
    // scroll to top - 3 options, none of it seems to work
    // window.addEventListener('beforeunload', () => window.scrollTo(0, 0));
    // document.querySelector('.header').scrollIntoView({behavior: 'smooth'});
    // window.scrollTo({top: 0, left: 0, behavior: 'smooth'});

    // hard reset filter options for Firefox
    document.querySelector('.filter__date').value = 'ALL';
    document.querySelector('.filter__cinema').value = 'ALL';

    // render loader
    programView.renderLoader();

    // get cinema programs
    await model.getProgram();
    // console.log(model.state.cinemaProgram);

    // sort program (date)
    model.sortProgram(model.state.cinemaProgram);
    // console.log(model.state);

    // remove loader
    // document.querySelector('.program > .loader-box').remove(); // use with a test movie
    programView.clear(); // use in prod

    // render program
    programView.render(model.state.cinemaProgram.slice(0, RESULTS_PER_PAGE));

    // if number of movies more than limit for one page render 'load more' button
    if (model.state.cinemaProgram.length > RESULTS_PER_PAGE) programView.renderLoadMore();
  } catch(err) {
    console.error(err);
    programView.renderError();
  }
};


const controlMovieDetails = async function(movie, render = true) {
  try {
    // scroll clicked movie into view
    // first remove scroll event listener that shows 'back to top' btn when scrolling up; also remove 'back to top' btn
    window.removeEventListener('scroll', scrollView.scrollHandler);
    document.querySelector('.back-to-top-box').classList.remove('btt-visible');
    // timeout - waiting for other active movie accordion details to be collapsed, then scroll new active in to view
    setTimeout(() => movie.scrollIntoView({behavior: 'smooth'}), 100);
    //false by default, if true remove 'back to top' btn
    scrollView.scrollIntoViewActive = true;
    // activate event listener after 2 seconds (taking in account time spent scrolling into view, scrolling into view can also be in 'up' direction, we don't want 'back to top' btn visible at this point)
    setTimeout(() => scrollView.backToTop(), 2000);
    // movieView.backToTop();


    // render loader
    if (render) movieView.renderLoader();

    // remove active class from other movies
    model.removeActive();
    // on movie__overview, accessibility thing
    model.removeAriaExpanded();

    // add active class to clicked movie; set aria-expanded to true
    movie.classList.add('active');
    movie.querySelector('.movie__overview').setAttribute('aria-expanded', true);

    // get movie details (movie page), parameter is html movie data attributes
    // console.log(movie.dataset.id);
    if (render) await model.getMovieDetails(movie.dataset.id);

    // remove loader
    if (render) movie.querySelector('.loader-box').remove();

    // render movie details
    if (render) movieView.render(model.state.movieDetail);

    // remove loader (from html markup) when image loaded
    if (render) movieView.checkImgLoaded(movie);

    // make links in movie description content (if any) open in new tab
    if (render) [...movie.querySelectorAll('.description__content a')]?.forEach(link => {
      link.setAttribute('target', '_blank');
    });

    // scrollIntoView originally here

  } catch(err) {
    // console.error(err);
    // scroll into view even if error
    setTimeout(() => movie.scrollIntoView({behavior: 'smooth'}),100);
    movieView.renderError(movie.dataset.movieUrl);
  }
};


// load more clicked
const controlPagination = function() {
  programView.renderLoader();
  model.state.page++;
  // console.log(model.state.page);
  document.querySelector('.load-more').remove();
  document.querySelector('.program > .loader-box').remove();

  // if filters active get filtered program, otherwise complete program, then render next page (slice)
  programView.render((model.state.filtersActive ? model.state.filteredCinemaProgram : model.state.cinemaProgram).slice((model.state.page - 1) * RESULTS_PER_PAGE, model.state.page * RESULTS_PER_PAGE));

  // first movie on each page has class '.first', get all 'first' movies
  // const firstOnPage = document.querySelectorAll('.first'); // decided againts using this scroll

  // scroll last (most recent) 'first' movie into view - active movie (if there's one) is not collapsed, therefore no timeout
  // firstOnPage[firstOnPage.length - 1].scrollIntoView({behavior: 'smooth'}); // decided againts using this scroll

  // render another btn, either 'load more' or 'load more end' (there aren't more results)
  model.state.page === model.state.pagesTotal ? programView.renderLastPage() : programView.renderLoadMore();
};


// error, if on program reload page, if on movie try fetch and render again
const controlError = async function(movie) {
  movie.querySelector('.error-box').remove();
  await controlMovieDetails(movie, true);
};


// filters
const controlFilter = function(filter, value) {
  // console.log(filter, value);
  const programFiltered = model.filterProgram(filter, value);
  programView.clear();

  // filters can be inactive even if filter buttons fire events - selected options can be 'complete program' (ALL - date filter) or 'all cinemas' (ALL - cinema filter)
  if (model.state.filtersActive) {
    // filters active - render filtered program
    programView.render(programFiltered.slice(0, RESULTS_PER_PAGE));
    // if no results render no results msg
    if (programFiltered.length === 0) programView.renderNoResults();
    // if number of movies more than limit for one page render 'load more' button
    if (programFiltered.length > RESULTS_PER_PAGE) programView.renderLoadMore();
  };
  if (!model.state.filtersActive) {
    // filter not active - render complete program
    programView.render(model.state.cinemaProgram.slice(0, RESULTS_PER_PAGE));
    // if number of movies more than limit for one page render 'load more' button
    if (model.state.cinemaProgram.length > RESULTS_PER_PAGE) programView.renderLoadMore();
  };
};


// reset filters, render complete program
const controlResetFilters = function() {
  model.resetFilteredProgram();
  programView.clear();
  programView.render(model.state.cinemaProgram.slice(0, RESULTS_PER_PAGE));
  if (model.state.cinemaProgram.length > RESULTS_PER_PAGE) programView.renderLoadMore();
};


// init iife (immediately invoked function expression)
(function() {
  programView.addHandlerRenderCinemaProgram(controlCinemaProgram);
  movieView.addHandlerRenderMovieDetails(controlMovieDetails);
  programView.addHandlerRenderAnotherPage(controlPagination);
  errorView.addHandlerRefresh(controlError);
  filterView.addHandlerFilter(controlFilter);
  filterView.addHandlerReset(controlResetFilters);
})();