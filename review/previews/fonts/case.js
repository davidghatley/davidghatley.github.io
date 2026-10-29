// font library case page: the library is its own page, so the case study is the library.
export default function mount(root, { base }) {
  location.replace(base + 'fonts/index.html');
  root.innerHTML = '<p><a href="' + base + 'fonts/index.html">Open the font library</a></p>';
}
