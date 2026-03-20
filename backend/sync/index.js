import mongoose from 'mongoose';
// import puppeteer from 'puppeteer-core';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
// import chromium from '@sparticuz/chromium'; // local testing
import chromium from '@sparticuz/chromium-min'; // for AWS deploy
import ProgramModel from '../shared/models/programModel.js';
import MovieModel from '../shared/models/movieModel.js';
import * as Movie from './movie.js';
import * as Program from './program.js';
import { asyncTimeout, withRetry, logError } from '../shared/utils.js';



puppeteer.use(StealthPlugin());

const getBrowser = async function() {
  if (process.env.NODE_ENV === 'production') {
    return puppeteer.launch({
      args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(`https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar`),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    return puppeteer.launch({
      headless: true,
      executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
      args: ['--hide-scrollbars', '--disable-web-security'],
      ignoreHTTPSErrors: true,
    });
  }
};



const getProgram = async function(browser) {
  const [kfePage, nosPage] = await Promise.all([browser.newPage(), browser.newPage()]);


  const lum = withRetry(() => Program.getProgramLum());
  const kfe = withRetry(() => Program.getProgramKfe(kfePage));
  const nos = withRetry(() => Program.getProgramNos(nosPage));
  const mla = withRetry(() => Program.getProgramMla());

  const results = await Promise.allSettled([lum, kfe, nos, mla]);

  let program = [];

  results.forEach(result => {
    if (result.status === 'fulfilled') program.push(...result.value);
    if (result.status === 'rejected') {
      logError('get_program', result.reason);
    }
  });

  console.log('---Got all programs---');

  return program;
};



const updateMovies = async function(page, movieIds, program) {
  for (let movId of movieIds) {
    try {
      const cinema = movId.slice(0, 3);
      const movie = program.filter(el => el.id === movId);

      const doc = await MovieModel.findOne({ movieId: movId });
      // console.log(doc);

      if (doc) {
        movie.forEach(el => el.movies = doc);

        // console.log(`'${movie[0].title}' embedded to program (${cinema})`);
      }
      
      let movieDetails;

      if (!doc) {
        await asyncTimeout(500);

        if (cinema === 'KFE') movieDetails = await withRetry(() => Movie.getMovieKfe(page, movie[0].url));
        if (cinema === 'NOS') movieDetails = await withRetry(() => Movie.getMovieNos(page, movie[0].url));
        if (cinema === 'LUM') movieDetails = await withRetry(() => Movie.getMovieLum(movie[0].url));
        if (cinema === 'MLA') movieDetails = await withRetry(() => Movie.getMovieMla(movie[0].url));
        
        const newDoc = await MovieModel.create({ ...movieDetails, movieId: movId });
        // console.log(newDoc);
        movie.forEach(el => el.movies = newDoc);

        // console.log(`'${movie[0].title}' visited and embedded to program (${cinema})`);
      }
    } catch(err){
      logError('get_movie', err);
    }
  }

  console.log('---Movies in DB updated---');
};



const updateProgram = async function(program) {
  try {
    await ProgramModel.deleteMany({});
    await ProgramModel.insertMany(program);
    console.log('---Program in DB updated---');
  } catch(err) {
    logError('update_program', err);
  }
};



export const handler = async function() {

  try {
    const DB = process.env.DATABASE.replace('<db_password>', process.env.DATABASE_PASSWORD);
    await mongoose.connect(DB);
    console.log('DB connection successful');
  } catch(err) {
    logError('db_connection', err);
    return;
  }

  let browser;

  try {
    browser = await getBrowser();
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    page.on('console', async msg => {
      const args = await Promise.all(msg.args().map(arg => arg.jsonValue()));
      console.log('BROWSER:', ...args);
    });

    const program = await getProgram(browser);
    const movieIds = Array.from(new Set(program.map(el => el.id)));
    await updateMovies(page, movieIds, program);
    await updateProgram(program);

    console.log(`DONE | ${new Date()}`);
  } catch(err) {
    logError('main_function', err);
  } finally {
    if (browser) await browser.close();
  }
};

await handler(); // only for local testing







// TESTING ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// const browser = await getBrowser(); // local testing
// const page = await browser.newPage(); // local testing
// -----------------------------------------------------------

// console.log(await withRetry(() => Program.getProgramKfe(page)));
// console.log(await withRetry(() => Program.getProgramNos(page)));

// console.log(programDetails.length);
// console.log(Array.from(new Set(programDetails.map(el => el.movieId))).length);

// await getProgramKfeNos('https://www.kfe.sk/cely-program', 'KFE');
// await getProgramKfeNos('https://www.nostalgia.sk/program', 'NOS');
// const a = await Movie.getMovieLum('https://www.kino-lumiere.sk/klient-863/kino-241/stranka-8409/film-822260');
// console.log(a);

// const lum = await getProgramLum();
// await Program.create(lum[0]);

// await getProgramMla();

// await Movie.getMovieKfe(page, 'https://www.kfe.sk/film/8660');
// const a = await Movie.getMovieNos(page, 'https://www.nostalgia.sk/film/8462');
// console.log(a);
// const detailKfe = await getMovieKfeNos('https://www.kfe.sk/film/7499', 'KFE', page);
// console.log(detailKfe);

// const detailMla = await Movie.getMovieMla('https://www.kinomladost.sk/klient-3538/kino-513/stranka-16300/film-826571')
// console.log(detailMla);

// -----------------------------------------------------------
// await browser.close() // local testing
