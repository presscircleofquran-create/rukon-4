// Simple note editor (admin): 3 styles (big title / small title / paragraph), bold/italic/underline, align, lists.
// Whatever is pasted is cleaned: only structure stays, the font is always the site's font.
import { esc, simpleHtml, textToSimple } from './islamic.js';

const b = (a, ic, t, lbl = '') => `<button type="button" data-a="${a}" title="${esc(t)}" aria-label="${esc(t)}">${ic ? `<i class="fa-solid fa-${ic}"></i>` : ''}${lbl ? `<span>${lbl}</span>` : ''}</button>`;

export function createEditor(host, { placeholder = 'এখানে লেখা পেস্ট করুন বা লিখুন...', minHeight = 320, onSave = null } = {}) {
  host.classList.add('ed');
  host.innerHTML = `<div class="ed-bar">
    <div class="ed-grp" data-grp="block">${b('h1', '', 'প্রধান শিরোনাম (সূচিপত্রে বড়)', 'বড় শিরোনাম')}${b('h2', '', 'উপ-শিরোনাম (সূচিপত্রে ছোট)', 'ছোট শিরোনাম')}${b('p', '', 'সাধারণ লেখা', 'প্যারাগ্রাফ')}</div>
    <div class="ed-grp">${b('bold', 'bold', 'বোল্ড')}${b('italic', 'italic', 'ইটালিক')}${b('underline', 'underline', 'আন্ডারলাইন')}</div>
    <div class="ed-grp">${b('justifyLeft', 'align-left', 'বামে')}${b('justifyCenter', 'align-center', 'মাঝে')}${b('justifyRight', 'align-right', 'ডানে')}${b('justifyFull', 'align-justify', 'দুই পাশে সমান')}</div>
    <div class="ed-grp">${b('insertUnorderedList', 'list-ul', 'বুলেট লিস্ট')}${b('insertOrderedList', 'list-ol', 'নম্বর লিস্ট')}</div>
    <div class="ed-grp">${b('undo', 'rotate-left', 'আনডু')}${b('redo', 'rotate-right', 'রিডু')}</div>
  </div>
  <div class="ed-area is-empty" contenteditable="true" spellcheck="false" lang="bn" role="textbox" aria-multiline="true" data-ph="${esc(placeholder)}" style="min-height:${minHeight}px"></div>`;
  const area = host.querySelector('.ed-area'), bar = host.querySelector('.ed-bar');
  const sync = () => area.classList.toggle('is-empty', !area.textContent.trim() && !area.querySelector('ul,ol'));
  const norm = () => { document.execCommand('defaultParagraphSeparator', false, 'p'); };
  const refresh = () => {
    let blk = ''; try { blk = (document.queryCommandValue('formatBlock') || '').toLowerCase(); } catch (e) { /* ignore */ }
    const inside = area.contains(getSelection().anchorNode);
    bar.querySelectorAll('[data-grp=block] button').forEach(x => x.classList.toggle('on', inside && (x.dataset.a === blk || (x.dataset.a === 'p' && !/^h[12]$/.test(blk)))));
    ['bold', 'italic', 'underline', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull', 'insertUnorderedList', 'insertOrderedList'].forEach(c => { const x = bar.querySelector(`[data-a=${c}]`); let on = false; try { on = inside && document.queryCommandState(c); } catch (e) { /* ignore */ } x.classList.toggle('on', !!on); });
  };
  bar.addEventListener('mousedown', (e) => { if (e.target.closest('button')) e.preventDefault(); });
  bar.addEventListener('click', (e) => {
    const x = e.target.closest('button'); if (!x) return; area.focus({ preventScroll: true }); norm();
    const a = x.dataset.a;
    if (a === 'h1' || a === 'h2' || a === 'p') document.execCommand('formatBlock', false, a.toUpperCase()); else document.execCommand(a, false, null);
    sync(); refresh();
  });
  area.addEventListener('input', sync);
  document.addEventListener('selectionchange', () => { if (area.contains(getSelection().anchorNode)) refresh(); });
  area.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (onSave) onSave(); } });
  area.addEventListener('paste', (e) => {
    e.preventDefault(); norm();
    const cd = e.clipboardData, h = cd.getData('text/html'), t = cd.getData('text/plain');
    const clean = h ? simpleHtml(h) : textToSimple(t);
    document.execCommand('insertHTML', false, clean || textToSimple(t)); sync();
  });
  area.addEventListener('drop', (e) => e.preventDefault());
  const cur = () => simpleHtml(area.innerHTML);
  return {
    getHtml() { return area.textContent.trim() || area.querySelector('ul,ol') ? cur() : ''; },
    getText() { return (area.innerText || area.textContent || '').trim(); },
    setHtml(h) { area.innerHTML = simpleHtml(h); sync(); },
    clear() { area.innerHTML = ''; sync(); },
    setKey() {}, markSaved() {}, focus() { area.focus(); }
  };
}
