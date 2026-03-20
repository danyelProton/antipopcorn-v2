class ScrollView {
  scrollPos = 0;
  toTopBtn = document.querySelector('.back-to-top-box');
  scrollIntoViewActive = false;

  constructor() {
    this.backToTop();
    this.#observerHeaderAndFooter();
  }

  // scroll event listener callback
  #handleScroll() {
    // console.log('scrollY before', window.scrollY);
    // console.log('scrollPos', this.scrollPos);
    // console.log(window.scrollY > this.scrollPos);

    // scrollPos = starting SVGTextPositioningElement, window.scrollY = new position; when current more than current or movie accordion has been opened and is being scrolled into view - remove back to top btn; otherwise show it (but onyl if current minus starting is more than 5)
    window.scrollY > this.scrollPos || this.scrollIntoViewActive ? this.toTopBtn.classList.remove('btt-visible') : this.scrollPos - window.scrollY > 5 ? this.toTopBtn.classList.add('btt-visible') : null;
    // setTimeout(() => this.scrollPos = window.scrollY, 100);
    this.scrollPos = window.scrollY;
    // console.log('new scrollPos after', this.scrollPos);
    this.scrollIntoViewActive = false;
  }

  // callback bound to this
  scrollHandler = this.#handleScroll.bind(this);

  // add scroll event listener
  backToTop() {
    // console.log(this.scrollPos);
    window.addEventListener('scroll', this.scrollHandler, {passive: true});
  }


  // remove/add scroll event listener based on intersecting header and footer (no back to top btm when footer or header in viewport)
  #observerHeaderAndFooter() {
    const header = document.querySelector('.header');
    const footer = document.querySelector('.footer');
    let headerIntersect;
    let footerIntersect;

    const options = {
      root: null,
      rootMargin: '100px',
      treshold: 0,
    };

    const observerCallback = function(entries) {
      // const entry = entries[0];
      entries.forEach(entry => {
        if (entry.target === header) headerIntersect = entry.isIntersecting;
        if (entry.target === footer) footerIntersect = entry.isIntersecting;
      });
      // console.log('header', headerIntersect);
      // console.log('footer', footerIntersect);
      // console.log(entry);
      // console.log(entries);
      if (headerIntersect || footerIntersect || this.scrollIntoViewActive) {
        this.toTopBtn.classList.remove('btt-visible');
        window.removeEventListener('scroll', this.scrollHandler);
      }
      if (!headerIntersect && !footerIntersect && !this.scrollIntoViewActive) {
        this.backToTop();
      };
    }.bind(this);

    const observer = new IntersectionObserver(observerCallback, options);
    observer.observe(header);
    observer.observe(footer);
  }
}

export default new ScrollView();