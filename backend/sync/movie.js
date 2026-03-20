import { JSDOM } from 'jsdom';

// FILM EUROPE ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const getMovieKfe = async function(page, url, cinema = 'KFE') {
  const res = await page.goto(url);
  if (!res.ok()) throw new Error(`${cinema} movie (${url}) fetch failed: ${res.status()}`);

  const webContentFromScript = await page.evaluate((cinemaArg) => {
    const script = [...document.body.querySelectorAll('script')].find(el => el.textContent.includes('17:[\\\"$\\\",\\\"div\\\",\\\"showDetail-1'));
    if (!script) throw new Error(`Script not found for cinema ${cinemaArg} (movie - ${url})`);
    return script.textContent;
  }, cinema);
  // console.log(webContentFromScript);

  const regexContent = /self\.__next_f\.push\(\[1,"17:(.+)\\n"\]\)/m;
  const webContentMatchGroup = webContentFromScript.match(regexContent)[1];
  // console.log(webContentMatchGroup);
  const parsedWebContent = JSON.parse(JSON.parse(`"${webContentMatchGroup}"`));
  // console.log(parsedWebContent);
  const showInfo = parsedWebContent[3].children[0][3].show;
  // console.log(showInfo);

  let titleOriginal, country, language, year, genre, length, director, actors, description, image, youtubeId;

  titleOriginal = showInfo.originalTitle;
  // console.log(titleOriginal);
  country = showInfo.countriesTranslated.map(el => el.sk).join(', ');
  // console.log(country);
  language = parsedWebContent[3].children[1][3].events[0].versionTranslated?.sk;
  // console.log(language);
  year = showInfo.productionYear;
  // console.log(year);
  genre = showInfo.genresTranslated.map(el => el.sk).join(', ');
  // console.log(genre);
  length = `${showInfo.duration} minút`;
  // console.log(length);
  director = showInfo.crew.filter(el => el.crewRoleCode === 'director')[0]?.persons.map(el => el.name).join(', ');
  // console.log(director);
  actors = showInfo.crew.filter(el => el.crewRoleCode === 'actor')[0]?.persons.map(el => el.name).join(', ');
  // console.log(actors);
  const translation = showInfo.translations.filter(el => el.localeCode === 'sk')[0] || showInfo.translations[0];
  description = translation.description.length < 5 ? `<p>${translation.tagline}</p>` : translation.description;
  // console.log(description);
  image = cinema === 'KFE' ? showInfo.coverPrimaryImage?.url : showInfo.photoPrimaryImage?.url;
  // console.log(image);
  youtubeId = showInfo.videos[0]?.sourceVideoId;
  // console.log(youtubeId);

  return { titleOriginal, country, language, year, genre, length, director, actors, description, image, youtubeId }
};


// NOSTALGIA ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const getMovieNos = async function(page, url, cinema = 'NOS') {
  return await getMovieKfe(page, url, cinema);
};




// LUMIERE ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const getMovieLum = async function(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`LUM movie (${url}) fetch failed: ${res.status()}`);
  const data = await res.text();
  const { document } = new JSDOM(data).window;
  const html = document;
  // console.log(html);

  let titleOriginal, country, language, year, genre, length, director, actors, description, image, youtubeId;

  const tableRows = [...html.querySelectorAll('tr')];
  const detailTab = [...html.querySelectorAll('#lavyPanel > .detailfullsize > .padding')];
  if (!tableRows || !detailTab) throw new Error(`Movie detail elements not found for cinema LUM (movie - ${url})`);

  language = [...html.querySelectorAll('.iconsContainer > .btn')].filter(el => el.className === 'btn').map(el => el.attributes.title.textContent).join(', ');
  // console.log(language);
  genre = tableRows.filter(row => row.children[0].textContent === 'Žáner:')[0]?.children[1].textContent;
  // console.log(genre);
  length = tableRows.filter(row => row.children[0].textContent === 'Dĺžka:')[0]?.children[1].textContent;
  // console.log(length);

  //either from inf table placed on image or from details tab
  const director1 = tableRows.filter(row => row.children[0].textContent === 'Réžia:')[0]?.children[1]?.textContent;
  const director2temp = [...detailTab.filter(el => el.className === 'padding')[0].querySelectorAll('p')].filter(el => el.textContent && [...el.children].filter(childEl => childEl.tagName === 'STRONG' && childEl.textContent.toLowerCase().includes('réžia')).length)[0];
  const director2 = director2temp ? [...director2temp.childNodes].filter(el => el.textContent.toLowerCase().includes('réžia'))[0].nextSibling.textContent.replaceAll('•', '').trim() : '';
  director = director1 ? director1 : director2 ? director2 : '';
  // console.log(director);

  //either from inf table placed on image or from details tab
  const actors1 = tableRows.filter(row => row.children[0].textContent === 'Hrajú:')[0]?.children[1].textContent;
  const actors2temp = [...detailTab.filter(el => el.className === 'padding')[0].querySelectorAll('p')].filter(el => el.textContent && [...el.children].filter(childEl => childEl.tagName === 'STRONG' && childEl.textContent.toLowerCase().includes('hrajú')).length)[0];
  const actors2 = actors2temp ? [...actors2temp.childNodes].filter(el => el.textContent.toLowerCase().includes('hrajú'))[0].nextSibling.textContent.replaceAll('•', '').trim() : '';
  actors = actors1 ? actors1 : actors2 ? actors2 : '';
  // console.log(actors);

  // h2 and p elements with text content, excluding button and those with rezia, hraju, etc. in content
  description = [...detailTab.filter(el => el.className === 'padding')[0].querySelectorAll('h2, p')].filter(el => el.textContent && ![...el.children].filter(childEl => childEl.tagName === 'BUTTON' || (childEl.tagName === 'STRONG' && (childEl.textContent.toLowerCase().includes('réžia') || childEl.textContent.toLowerCase().includes('hrajú') || childEl.textContent.toLowerCase().includes('výroby') || childEl.textContent.toLowerCase().includes('premiéry') || childEl.textContent.toLowerCase().includes('pôvodu') || childEl.textContent.toLowerCase().includes('jazyková')))).length).map(el => el.outerHTML).join('');
  // console.log(description);
  image = html.querySelector('.hlavnePlatnoPlatno > img').attributes.src.textContent;
  // console.log(image);
  youtubeId = html.querySelector('.playYTTrailer')?.dataset?.ytid;
  // console.log(youtubeId);


  // director, actors, description - another method
  // director = tableRows.filter(row => row.children[0].textContent === 'Réžia:')[0]?.children[1].textContent;
  // console.log(director);
  // actors = tableRows.filter(row => row.children[0].textContent === 'Hrajú:')[0]?.children[1].textContent;
  // console.log(actors);
  // description = [...detailTab.filter(el => el.className === 'padding')[0].querySelectorAll('h2, p')].filter(el => el.textContent && !el.children.length).map(el => el.textContent).join('<br><br>');


  titleOriginal = html.querySelector('.platno-header-inner > h1').attributes?.title?.textContent.trim() ?? html.querySelector('.platno-header-inner > h1').textContent.trim();
  // console.log(titleOriginal);
  country = [...html.querySelectorAll('.col > .flags > *')].map(country => country.textContent.trim()).join(', ');
  // console.log(country);
  year = html.querySelector('.event-subheader').textContent.match(/, \d\d\d\d,/gm)?.toString().slice(2, -1);
  // console.log(year);

  return { titleOriginal, country, language, year, genre, length, director, actors, description, image, youtubeId };
};




// MLADOST ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const getMovieMla = async function(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MLA movie (${url}) fetch failed: ${res.status()}`);
  const data = await res.text();
  const { document } = new JSDOM(data).window;
  const html = document;

  let titleOriginal, country, language, year, genre, length, director, actors, description, image, youtubeId;


  // get some information helper function
  const infoNosMla = function(info) {
    return [...html.querySelectorAll('.film-platno-right > p')].filter(row => row.children[0].textContent === info)[0]?.childNodes[1]?.textContent?.trim();
  };


  titleOriginal = html.querySelector('.film-platno-right > p')?.textContent;
  if (!titleOriginal) throw new Error(`Movie detail elements not found for cinema MLA (movie - ${url})`);
  // console.log(titleOriginal);
  country = infoNosMla('Krajina pôvodu: ');
  // console.log(country);
  language = html.querySelector('.pull-right').children[0]?.textContent;
  // console.log(language);
  const yearTemp = infoNosMla('Premiéra: ');
  year = yearTemp ? yearTemp.match(/\d\d\d\d/gm)[0] : undefined;
  // console.log(year);
  genre = infoNosMla('Žáner: ');
  // console.log(genre);
  length = infoNosMla('Dĺžka: ');
  // console.log(length);
  director = [...html.querySelectorAll('.filmOsoby > p')][0] && [...[...html.querySelectorAll('.filmOsoby > p')][0].childNodes].filter(el => el.previousSibling?.textContent === 'Réžia: ')[0]?.textContent.replaceAll('•', '').trim();
  // console.log(director);
  actors = [...html.querySelectorAll('.filmOsoby > p')][0] && [...[...html.querySelectorAll('.filmOsoby > p')][0].childNodes].filter(el => el.previousSibling?.textContent === 'Hrajú: ')[0]?.textContent;
  // console.log(actors);
  description = [...html.querySelector('.popis').children].filter(el => (el.tagName === 'H3' || el.tagName === 'P') && el.textContent && !el.children.length).map(el => el.outerHTML).join('');
  // console.log(description);
  image = html.querySelector('.topPanel > div > img').attributes.src.textContent;
  // console.log(image);
  youtubeId = html.getElementById('trailerYT')?.attributes?.youtubeid?.value;
  // console.log(youtubeId);

  return { titleOriginal, country, language, year, genre, length, director, actors, description, image, youtubeId }
};