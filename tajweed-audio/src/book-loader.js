export function bookLoader() {
 const el = document.createElement('span'); el.className='animated-book'; el.setAttribute('aria-hidden','true');
 el.innerHTML='<span class="book-cover"></span><span class="book-left"></span><span class="book-right"></span><span class="book-turn"></span>'; return el;
}
