import { getSupabase } from './supabase-client.js';

const message = document.querySelector('#blog-message');
const postGrid = document.querySelector('#blog-posts');
const article = document.querySelector('#blog-article');
const toolbar = document.querySelector('#blog-toolbar');
const searchInput = document.querySelector('#blog-search');
const postCount = document.querySelector('#blog-post-count');
const heading = document.querySelector('#blog-heading');
const intro = document.querySelector('#blog-intro');
const params = new URLSearchParams(window.location.search);
const slug = params.get('slug');
const navbar = document.querySelector('#navbar');
const navToggle = document.querySelector('.mobile-nav-toggle');

navToggle.addEventListener('click', () => {
  const isOpen = navbar.classList.toggle('navbar-mobile');
  navToggle.classList.toggle('bi-list');
  navToggle.classList.toggle('bi-x');
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
});

navbar.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navbar.classList.remove('navbar-mobile');
    navToggle.classList.add('bi-list');
    navToggle.classList.remove('bi-x');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menu');
  });
});

const formatDate = (date) => new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric'
}).format(new Date(date));

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle('is-error', isError);
  message.hidden = false;
}

function addImage(container, imageUrl, alt, className) {
  if (!imageUrl) return;
  const image = document.createElement('img');
  image.src = imageUrl;
  image.alt = alt;
  image.loading = 'lazy';
  image.className = className;
  image.addEventListener('error', () => image.remove(), { once: true });
  container.append(image);
}

function renderCards(posts) {
  postGrid.replaceChildren();
  const query = searchInput.value.trim().toLocaleLowerCase('pt-BR');
  const filtered = posts.filter((post) => {
    const searchableText = `${post.title} ${post.excerpt} ${post.category}`.toLocaleLowerCase('pt-BR');
    return searchableText.includes(query);
  });

  postCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'publicação' : 'publicações'}`;
  if (!filtered.length) {
    showMessage(posts.length ? 'Nenhuma publicação corresponde à sua busca.' : 'Ainda não há publicações. Volte em breve para conferir as novidades.');
    return;
  }

  message.hidden = true;
  for (const post of filtered) {
    const card = document.createElement('article');
    card.className = 'blog-card';

    const link = document.createElement('a');
    link.className = 'blog-card-link';
    link.href = `noticias.html?${new URLSearchParams({ slug: post.slug })}`;
    link.setAttribute('aria-label', `Ler: ${post.title}`);

    const cover = document.createElement('div');
    cover.className = 'blog-card-cover';
    addImage(cover, post.image_url, post.title, 'blog-card-image');
    if (!cover.childElementCount) {
      const icon = document.createElement('i');
      icon.className = 'bi bi-lightning-charge';
      icon.setAttribute('aria-hidden', 'true');
      cover.append(icon);
    }

    const body = document.createElement('div');
    body.className = 'blog-card-body';
    const category = document.createElement('span');
    category.className = 'blog-category';
    category.textContent = post.category || 'Geral';
    const date = document.createElement('time');
    date.className = 'blog-date';
    date.dateTime = post.published_at;
    date.textContent = formatDate(post.published_at);
    const title = document.createElement('h2');
    title.textContent = post.title;
    const excerpt = document.createElement('p');
    excerpt.textContent = post.excerpt || 'Leia a publicação completa.';
    const readMore = document.createElement('span');
    readMore.className = 'blog-read-more';
    readMore.innerHTML = 'Ler artigo <i class="bi bi-arrow-right" aria-hidden="true"></i>';

    body.append(category, date, title, excerpt, readMore);
    link.append(cover, body);
    card.append(link);
    postGrid.append(card);
  }
}

function renderArticle(post) {
  toolbar.hidden = true;
  postGrid.hidden = true;
  heading.textContent = post.title;
  intro.textContent = post.excerpt || 'Conteúdo Coenel-DE sobre o mercado de energia.';
  document.title = `${post.title} | Coenel-DE`;

  const back = document.createElement('a');
  back.className = 'blog-back-link';
  back.href = 'noticias.html';
  back.innerHTML = '<i class="bi bi-arrow-left" aria-hidden="true"></i> Todas as notícias';

  const meta = document.createElement('div');
  meta.className = 'blog-article-meta';
  const category = document.createElement('span');
  category.className = 'blog-category';
  category.textContent = post.category || 'Geral';
  const date = document.createElement('time');
  date.dateTime = post.published_at;
  date.textContent = formatDate(post.published_at);
  meta.append(category, date);

  const content = document.createElement('div');
  content.className = 'blog-article-content';
  const paragraphs = (post.content || '').split(/\r?\n\s*\r?\n/).map((part) => part.trim()).filter(Boolean);
  for (const text of paragraphs) {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    content.append(paragraph);
  }

  article.replaceChildren(back, meta);
  addImage(article, post.image_url, post.title, 'blog-article-cover');
  article.append(content);
  article.hidden = false;
}

async function start() {
  try {
    const supabase = await getSupabase();
    if (slug) {
      const { data, error } = await supabase
        .from('posts')
        .select('title, slug, excerpt, content, category, image_url, published_at')
        .eq('slug', slug)
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        showMessage('Esta publicação não existe ou não está disponível.', true);
        return;
      }
      renderArticle(data);
      message.hidden = true;
      return;
    }

    const { data, error } = await supabase
      .from('posts')
      .select('title, slug, excerpt, category, image_url, published_at')
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(100);
    if (error) throw error;

    const posts = data || [];
    renderCards(posts);
    searchInput.addEventListener('input', () => renderCards(posts));
  } catch (error) {
    showMessage(error.message || 'Não foi possível carregar as publicações.', true);
  }
}

start();
