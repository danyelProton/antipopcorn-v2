import { RESULTS_PER_PAGE } from './config.js';


export const state = {
  movieDetail: {
    titleOriginal: '',
    country: '',
    language: '',
    year: '',
    genre: '',
    length: '',
    director: '',
    actors: '',
    description: '',
    image: '',
    youtubeId: '',
  },
  cinemaProgram: [],
  page: 1,
  pagesTotal: 1,
  filtersActive: false,
  filters: {
    startDate: '',
    endDate: '',
    cinema: '',
  },
  filteredCinemaProgram: [],
};


const setWeekday = function(date) {
  const today = new Date();
  const todayFormatted = today.toLocaleDateString('sk-SK', { month: '2-digit', day: '2-digit', year: '2-digit' });
  const tomorrow = addDays(today, 1);
  const tomorrowFormatted = tomorrow.toLocaleDateString('sk-SK', { month: '2-digit', day: '2-digit', year: '2-digit' });
  
  let weekday;

  if (date.toLocaleDateString('sk-SK', { month: '2-digit', day: '2-digit', year: '2-digit' }) === todayFormatted) {
    weekday = 'dnes';
  } else if (date.toLocaleDateString('sk-SK', { month: '2-digit', day: '2-digit', year: '2-digit' }) === tomorrowFormatted) {
    weekday = 'zajtra';
  } else {
    weekday = date.toLocaleString('sk-SK', { weekday: 'long' });
  };

  return weekday;
};


export const getProgram = async function() {
  try {
    const url = import.meta.env.MODE === 'development' ? '/api/program' : import.meta.env.VITE_PROGRAM_URL;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch program')
    const data = await res.json();
    state.cinemaProgram = data.data;
    state.cinemaProgram.forEach(el => {
      el.date = new Date(el.date);
      el.weekday = setWeekday(el.date);
  });
  } catch(err) {
    throw err;
  }
};


export const sortProgram = function(programList) {
  // sort - if it returns a negative value, a will be ordered before b; if  0, the ordering of a and b won’t change; if a positive value, b will be ordered before a - doesn't seem to be 100% reliable when using 'greater than' and 'less than', replaced with getTime method which returns the nr of milliseconds since the unix epoch
  // const sortedProgram = programList.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0));
  const sortedProgram = programList.sort((a, b) => a.date.getTime() - b.date.getTime());
  // console.log(new Date());

  // filter out movies that had already started
  state.cinemaProgram = sortedProgram.filter(mov => mov.date > new Date());

  state.pagesTotal = Math.ceil(state.cinemaProgram.length / RESULTS_PER_PAGE);
  // console.log(state.pagesTotal);
};


export const getMovieDetails = async function(id) {
  const movie = state.cinemaProgram.find(el => el.id === id);
  // console.log(movie);
  
  const { titleOriginal, country, language, year, genre, length, director, actors, description, image, youtubeId } = movie.movies[0];
  const url = movie.url;
  // console.log(state);

  state.movieDetail.titleOriginal = titleOriginal;
  state.movieDetail.director = director;
  state.movieDetail.actors = actors;
  state.movieDetail.year = year;
  state.movieDetail.country = country;
  state.movieDetail.length = length;
  state.movieDetail.genre = genre;
  state.movieDetail.language = language;
  state.movieDetail.description = description;
  state.movieDetail.image = image;
  state.movieDetail.url = url;
  state.movieDetail.youtubeId = youtubeId;
  // console.log(state);
};


export const removeActive = function() {
  const active = [...document.querySelectorAll('.active')];
  active.forEach(mov => mov.classList.remove('active'));
};


export const removeAriaExpanded = function() {
  const expanded = [...document.querySelectorAll('.movie__overview[aria-expanded=true]')];
  expanded.forEach(mov => mov.setAttribute('aria-expanded', false));
};


// for filterProgram f
const addDays = function(date, days) {
  // setHours() is used for midnight
  const newDate1 = new Date(new Date(date).setHours(0, 0, 0, 0));
  const newDate2 = new Date(newDate1.setDate(newDate1.getDate() + days));
  return newDate2;
};


// for filterProgram f
const changeDateFilters = function(startDateOffset, endDateOffset) {
  state.filters.startDate = addDays(new Date(), startDateOffset);
  state.filters.endDate = addDays(new Date(), endDateOffset);
};


export const filterProgram = function(filter, value) {
  // if (filter === 'startDate') state.filters[filter] = value ? new Date(`${value} 00:00`) : ''; //for calendar picker
  // if (filter === 'endDate') state.filters[filter] = value ? new Date(`${value} 23:59`) : ''; //for calendar picker
  if (filter === 'date') {
    // TOD = today, TOM = tomorrow, DAT = day after tomorrow, TW = this week, NW = next week
    if (value === 'TOD') changeDateFilters(0, 1);
    if (value === 'TOM') changeDateFilters(1, 2);
    if (value === 'DAT') changeDateFilters(2, 3);
    // calculate how many days left till the end of the week (SUN is 0 in getDay())
    if (value === 'TW') changeDateFilters(0, 7 - (new Date().getDay() === 0 ? 7 : new Date().getDay()) + 1);
    // calculate when next week and ends (SUN is 0 in getDay())
    if (value === 'NW') changeDateFilters(7 - (new Date().getDay() === 0 ? 7 : new Date().getDay()) + 1, 14 - (new Date().getDay() === 0 ? 7 : new Date().getDay()) + 1);
    if (value === 'ALL') {
      state.filters.startDate = '';
      state.filters.endDate = '';
    }
  }
  if (filter === 'cinema') state.filters[filter] = value === 'ALL' ? '' : value;
  // console.log(value);

  // change filtersActive boolean state if filters exist
  Object.values(state.filters).join('') ? state.filtersActive = true : state.filtersActive = false;
  // console.log(state.filters);
  // console.log(state.filtersActive);
  state.page = 1;

  if (state.filtersActive) {
    // filter cinemaProgram array using filters (true in ternary is fallback to execute function, but filters are not applied)
    state.filteredCinemaProgram = state.cinemaProgram.filter(mov => (state.filters.startDate ? mov.date >= state.filters.startDate : true) && (state.filters.endDate ? mov.date <= state.filters.endDate : true) && (state.filters.cinema ? mov.cinemaShort === state.filters.cinema : true));
    state.pagesTotal = Math.ceil(state.filteredCinemaProgram.length / RESULTS_PER_PAGE);
    // console.log(state.pagesTotal);
    return state.filteredCinemaProgram;
  };

  if (!state.filtersActive) {
    state.filteredCinemaProgram = [];
    state.pagesTotal = Math.ceil(state.cinemaProgram.length / RESULTS_PER_PAGE);
  };
};


export const resetFilteredProgram = function() {
  // document.querySelector('.filter__start-date').value = ''; //for calendar picker
  // document.querySelector('.filter__end-date').value = ''; //for calendar picker
  document.querySelector('.filter__date').value = 'ALL';
  document.querySelector('.filter__cinema').value = 'ALL';
  state.filtersActive = false;
  state.filters.startDate = '';
  state.filters.endDate = '';
  state.filters.cinema = '';
  state.page = 1;
  state.pagesTotal = Math.ceil(state.cinemaProgram.length / RESULTS_PER_PAGE);
  state.filteredCinemaProgram = [];
  // console.log(state);
};