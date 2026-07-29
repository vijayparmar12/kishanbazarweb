(() => {
  document.addEventListener('change', (event) => {
    const sort = event.target.closest('[data-sort-by]');
    if (!sort) return;

    const url = new URL(window.location.href);
    url.searchParams.set('sort_by', sort.value);
    url.searchParams.delete('page');
    window.location.assign(url.toString());
  });
})();
