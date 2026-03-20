class FilterView {
  addHandlerFilter(handler) {
    document.querySelector('.filter-bar').addEventListener('change', function(e) {
      const value = e.target.value;
      // console.log(value);
      const targetClasslist = e.target.classList;
      // if (targetClasslist.contains('filter__start-date')) handler('startDate', value);
      // if (targetClasslist.contains('filter__end-date')) handler('endDate', value);
      if (targetClasslist.contains('filter__date')) handler('date', value);
      if (targetClasslist.contains('filter__cinema')) handler('cinema', value);
    });
  }

  addHandlerReset (handler) {
    document.querySelector('.filter__reset').addEventListener('click', handler);
    document.querySelector('.logo-img').addEventListener('click', handler);
  }
}

export default new FilterView();