import { JSDOM } from 'jsdom';
import { LUM_PROGRAM_URL, MLA_PROGRAM_URL, LUM_MOVIE_URL, KFE_MOVIE_URL, NOS_MOVIE_URL, MLA_MOVIE_URL } from './config.js';
import { addDays } from '../shared/utils.js';
import { KFE_PROGRAM_URL, NOS_PROGRAM_URL } from './config.js';

// FILM EUROPE ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const getProgramKfe = async function(page, url = KFE_PROGRAM_URL, cinema = 'KFE') {
  const res = await page.goto(url);
  if (!res.ok()) throw new Error(`${cinema} program fetch failed: ${res.status()}`);

  const eventsListFromScript = await page.evaluate((cinemaArg) => {
    const scripts = Array.from(document.querySelectorAll('script'));
    const scriptPattern = cinemaArg === 'KFE' ? '16:[\\\"$\\\",\\\"$L1e\\\",\\\"eventsList-1' : '17:[\\\"$\\\",\\\"$L1f\\\",\\\"eventsList-2';
    const script = scripts.find(el => el.textContent.includes(scriptPattern));
    if (!script) throw new Error(`Script (program) not found for cinema ${cinemaArg}`);
    return script.textContent;
  }, cinema);

  const regexEventsList = /{\\"events\\":(.*),\\"localeCode\\":/m;
  const eventsListMatchGroup = eventsListFromScript.match(regexEventsList)[1];
  const programList = JSON.parse(JSON.parse(`"${eventsListMatchGroup}"`));

  // console.log(programList);

  const program = programList.map((mov, i) => {
    const date = new Date(mov.startsAt);

    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('sk-SK', { month: 'long' }).slice(0, 3);

    // weekday set in frontend

    // const today = new Date();
    // const todayFormatted = today.toLocaleDateString('sk-SK', { month: '2-digit', day: '2-digit', year: '2-digit' });
    // const tomorrow = addDays(today, 1);
    // const tomorrowFormatted = tomorrow.toLocaleDateString('sk-SK', { month: '2-digit', day: '2-digit', year: '2-digit' });

    // let weekday;
    // if (date.toLocaleDateString('sk-SK', { month: '2-digit', day: '2-digit', year: '2-digit' }) === todayFormatted) {
    //   weekday = 'dnes';
    // } else if (date.toLocaleDateString('sk-SK', { month: '2-digit', day: '2-digit', year: '2-digit' }) === tomorrowFormatted) {
    //   weekday = 'zajtra';
    // } else {
    //   weekday = date.toLocaleString('sk-SK', { weekday: 'long' });
    // };

    const time = date.toLocaleString('sk-SK', { hour: '2-digit', minute: '2-digit' });
    const title = mov.names.sk;
    const movieId = mov.show.id;
    const id = cinema === 'KFE' ? 'KFE' + movieId : 'NOS' + movieId;
    const url = cinema === 'KFE' ? KFE_MOVIE_URL + movieId : NOS_MOVIE_URL + movieId;

    return {
      cinemaShort: cinema === 'KFE' ? 'KFE' : 'NOS',
      cinema: cinema === 'KFE' ? 'Film Europe' : 'Nostalgia',
      date,
      day,
      month,
      // weekday,
      time,
      title,
      movieId,
      id,
      url,
    };
  });

  return program;
};



// NOSTALGIA ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const getProgramNos = async function(page, url = NOS_PROGRAM_URL, cinema = 'NOS') {
  return await getProgramKfe(page, url, cinema);
};




// LUMIERE ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const getProgramLum = async function() {
  const res = await fetch(LUM_PROGRAM_URL);
  if (!res.ok) throw new Error(`LUM program fetch failed: ${res.status()}`);
  const data = await res.text();
  const { document } = new JSDOM(data).window;

  const programList = Array.from(document.querySelectorAll('.calendar-left-table-tr'));
  if (!programList) throw new Error(`Program list not found for cinema LUM`);

  const regexMovieId = /film-\d\d\d\d\d\d?\d?\d?\d?/gm;
  
  const movieDates = programList.map(mov => mov.querySelector('.ap_date').textContent);
  // console.log(movieDates);
  // find index of a movie where month of the movie is less than month of the movie before (for example Dec, next movie Jan) - LUM and KFE do not show year in dates; -1 if not found
  const newYearIndex = movieDates.findIndex((date, i) => Number(date.split('.')[1]) < Number(movieDates[i === 0 ? 0 : i - 1].split('.')[1]));
  // console.log(newYearIndex);
  
  
  const program = programList.map((mov, i) => {
    const scrapedTime = mov.querySelector('.ap_time');
    const scrapedCalEventItem = mov.querySelector('.cal-event-item');

    // date as in movie program
    const dateString = mov.querySelector('.ap_date').textContent;
    // this date doesn't work in Safari
    // const date = new Date(`${dateString.split('.')[1]}-${dateString.split('.')[0]}-${newYearIndex === -1 ? new Date().getFullYear() : i < newYearIndex ? new Date().getFullYear() : new Date().getFullYear() + 1} ${mov.querySelector('.ap_time').textContent}`);
    // works in Safari, format - new Date(2024, 6, 25, 17, 30) (year, month (0-11), day, hour, minute); year + 1 for each movie index is less then newYearIndex (or -1 - see declared newYearIndex variable)
    const date = new Date(newYearIndex === -1 || i < newYearIndex  ? new Date().getFullYear() : new Date().getFullYear() + 1, Number(dateString.split('.')[1] - 1), dateString.split('.')[0], scrapedTime.textContent.split(':')[0], scrapedTime.textContent.split(':')[1]);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('sk-SK', {month: 'long'}).slice(0, 3);
    // const weekday = mov.querySelector('.dlhyDen')?.textContent ?? mov.querySelector('.ap_day').textContent; // weekday set in frontend
    const time = scrapedTime.textContent;
    const title = mov.querySelector('.text-underline')?.textContent;
    const movieId = scrapedCalEventItem.href.match(regexMovieId).toString().slice(5)
    const id = 'LUM' + scrapedCalEventItem.href.match(regexMovieId).toString().slice(5);
    const url = LUM_MOVIE_URL + movieId;

    return {
      cinemaShort: 'LUM',
      cinema: 'Lumière',
      date,
      day,
      month,
      // weekday,
      time,
      title,
      movieId,
      id,
      url,
    };
  });

  return program;
};




// MLADOST ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const getProgramMla = async function() {
  const res = await fetch(MLA_PROGRAM_URL);
  if (!res.ok) throw new Error(`MLA program fetch failed: ${res.status()}`);
  const data = await res.json();
  const { document } = new JSDOM(data.html).window;

  const programList = Array.from(document.querySelectorAll('.media'));
  if (!programList) throw new Error(`Program list not found for cinema MLA`);

  const regexMovieIdMladost = /film-\d\d\d\d\d\d\d?\d?\d?/gm;

  // MLA return movies and inside movies are dates (here named listItems)
  const program = programList.flatMap((mov, i) => {
    // console.log([...mov.children[3].children]);
    const scrapedLink = mov.querySelector('.media-heading > a');

    const listItems = [...mov.querySelectorAll('.list-group-item')].map(item => {
      const scrapedBtnBuy = item.querySelector('.btn-buy');

      // date as in movie program
      const dateString = item.children[0].textContent.slice(0, -5).replace(' ', '');
      const dateStringFull = item.children[0].textContent.replace(' ', '');
      // this date doesn't work in Safari
      // const date = new Date(`${dateStringFull.split('.')[1]}-${dateStringFull.split('.')[0]}-${dateStringFull.split('.')[2]} ${item.querySelector('.btn-buy').textContent}`);
      // works in Safari, format - new Date(2024, 6, 25, 17, 30) (year, month (0-11), day, hour, minute)
      const date = new Date(dateStringFull.split('.')[2], Number(dateStringFull.split('.')[1]) - 1, dateStringFull.split('.')[0], scrapedBtnBuy?.textContent.split(':')[0] || '09', scrapedBtnBuy?.textContent.split(':')[1] || '00');
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('sk-SK', {month: 'long'}).slice(0, 3);
      // const weekday = item.children[1].textContent.slice(1, -1).toLowerCase(); // weekday set in frontend
      const time = scrapedBtnBuy?.textContent || 'pozri<br>web';
      const title = scrapedLink.textContent;
      const movieId = scrapedLink.href.match(regexMovieIdMladost).toString().slice(5)
      const id = 'MLA' + scrapedLink.href.match(regexMovieIdMladost).toString().slice(5);
      const url = MLA_MOVIE_URL + movieId;

      return {
        cinemaShort: 'MLA',
        cinema: 'Mladosť',
        date,
        day,
        month,
        // weekday,
        time,
        title,
        movieId,
        id,
        url,
      };

    });
    // console.log(listItems);
    return listItems;
  });

  return program;
};