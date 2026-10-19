import { getSupabase } from './supabase-client.js';

const loginSection = document.querySelector('#admin-login');
const dashboard = document.querySelector('#admin-dashboard');
const loginForm = document.querySelector('#admin-login-form');
const loginMessage = document.querySelector('#admin-login-message');
const dashboardMessage = document.querySelector('#admin-dashboard-message');
const postForm = document.querySelector('#admin-post-form');
const postList = document.querySelector('#admin-post-list');
const titleInput = document.querySelector('#post-title');
const slugInput = document.querySelector('#post-slug');
const fileInput = document.querySelector('#post-image-file');
const saveButton = document.querySelector('#admin-save');
const editorHeading = document.querySelector('#editor-heading');
let supabase;
let slugWasEdited = false;

function showMessage(element, text, isError = false) {
  element.textContent = text;
  element.classList.toggle('is-error', isError);
  element.hidden = false;
}

function slugify(value) {
  return value.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(date));
}

function setSignedOut(messageText = '') {
  dashboard.hidden = true;
  loginSection.hidden = false;
  loginForm.reset();
  if (messageText) showMessage(loginMessage, messageText, true);
}

function setSignedIn() {
  loginSection.hidden = true;
  dashboard.hidden = false;
  loginMessage.hidden = true;
  dashboardMessage.hidden = true;
}

function resetEditor() {
  postForm.reset();
  document.querySelector('#post-id').value = '';
  document.querySelector('#post-category').value = 'Geral';
  editorHeading.textContent = 'Nova publicação';
  saveButton.textContent = 'Salvar publicação';
  slugWasEdited = false;
}

async function loadPosts() {
  postList.replaceChildren();
  const loading = document.createElement('p');
  loading.className = 'admin-list-empty';
  loading.textContent = 'Carregando publicações...';
  postList.append(loading);

  const { data, error } = await supabase
    .from('posts')
    .select('id, title, slug, category, status, published_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(200);
  if (error) throw error;

  postList.replaceChildren();
  if (!data.length) {
    const empty = document.createElement('p');
    empty.className = 'admin-list-empty';
    empty.textContent = 'Nenhuma publicação ainda. Use o editor para criar a primeira.';
    postList.append(empty);
    return;
  }

  for (const post of data) {
    const item = document.createElement('article');
    item.className = 'admin-post-item';
    const details = document.createElement('div');
    details.className = 'admin-post-details';
    const title = document.createElement('h3');
    title.textContent = post.title;
    const meta = document.createElement('p');
    meta.textContent = `${post.category} · Atualizado em ${formatDate(post.updated_at)}`;
    const status = document.createElement('span');
    status.className = `admin-status admin-status-${post.status}`;
    status.textContent = post.status === 'published' ? 'Publicado' : 'Rascunho';
    details.append(title, meta, status);

    const actions = document.createElement('div');
    actions.className = 'admin-post-actions';
    const editButton = document.createElement('button');
    editButton.className = 'admin-text-button';
    editButton.type = 'button';
    editButton.textContent = 'Editar';
    editButton.addEventListener('click', () => editPost(post.id));
    const deleteButton = document.createElement('button');
    deleteButton.className = 'admin-text-button admin-delete-button';
    deleteButton.type = 'button';
    deleteButton.textContent = 'Apagar';
    deleteButton.addEventListener('click', () => deletePost(post));
    actions.append(editButton, deleteButton);

    item.append(details, actions);
    postList.append(item);
  }
}

async function editPost(id) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, slug, excerpt, content, category, image_url, status')
      .eq('id', id)
      .single();
    if (error) throw error;

    document.querySelector('#post-id').value = data.id;
    document.querySelector('#post-title').value = data.title;
    document.querySelector('#post-slug').value = data.slug;
    document.querySelector('#post-category').value = data.category;
    document.querySelector('#post-status').value = data.status;
    document.querySelector('#post-excerpt').value = data.excerpt;
    document.querySelector('#post-content').value = data.content;
    document.querySelector('#post-image-url').value = data.image_url || '';
    fileInput.value = '';
    editorHeading.textContent = 'Editar publicação';
    saveButton.textContent = 'Salvar alterações';
    slugWasEdited = true;
    document.querySelector('#post-title').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    showMessage(dashboardMessage, error.message || 'Não foi possível abrir esta publicação.', true);
  }
}

async function deletePost(post) {
  if (!window.confirm(`Apagar a publicação “${post.title}”? Esta ação não pode ser desfeita.`)) return;

  try {
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (error) throw error;
    if (document.querySelector('#post-id').value === post.id) resetEditor();
    showMessage(dashboardMessage, 'Publicação apagada.');
    await loadPosts();
  } catch (error) {
    showMessage(dashboardMessage, error.message || 'Não foi possível apagar a publicação.', true);
  }
}

async function uploadCover(file) {
  const extensions = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
  };
  if (!extensions[file.type]) throw new Error('A imagem precisa estar no formato JPG, PNG ou WebP.');
  if (file.size > 5 * 1024 * 1024) throw new Error('A imagem não pode ultrapassar 5 MB.');

  const path = `${crypto.randomUUID()}.${extensions[file.type]}`;
  const { error } = await supabase.storage.from('blog-images').upload(path, file, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false
  });
  if (error) throw error;

  return {
    path,
    url: supabase.storage.from('blog-images').getPublicUrl(path).data.publicUrl
  };
}

async function savePost(event) {
  event.preventDefault();
  dashboardMessage.hidden = true;
  saveButton.disabled = true;
  let coverPath = null;

  try {
    const form = new FormData(postForm);
    const title = String(form.get('title')).trim();
    const slug = String(form.get('slug')).trim();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error('Use apenas letras minúsculas, números e hífens no endereço do artigo.');
    }

    let imageUrl = String(form.get('image_url')).trim() || null;
    const file = fileInput.files[0];
    if (file) {
      const uploaded = await uploadCover(file);
      coverPath = uploaded.path;
      imageUrl = uploaded.url;
    }

    const id = String(form.get('id')).trim();
    let publishedAt = null;
    if (form.get('status') === 'published') {
      if (id) {
        const { data, error } = await supabase.from('posts').select('published_at').eq('id', id).single();
        if (error) throw error;
        publishedAt = data.published_at || new Date().toISOString();
      } else {
        publishedAt = new Date().toISOString();
      }
    }

    const post = {
      title,
      slug,
      category: String(form.get('category')).trim(),
      excerpt: String(form.get('excerpt')).trim(),
      content: String(form.get('content')).trim(),
      image_url: imageUrl,
      status: String(form.get('status')),
      published_at: publishedAt,
      updated_at: new Date().toISOString()
    };

    const result = id
      ? await supabase.from('posts').update(post).eq('id', id)
      : await supabase.from('posts').insert(post);
    if (result.error) throw result.error;

    coverPath = null;
    resetEditor();
    try {
      await loadPosts();
    } catch (loadError) {
      showMessage(dashboardMessage, `Publicação salva, mas a lista não pôde ser atualizada: ${loadError.message || 'erro desconhecido'}`, true);
      return;
    }
    showMessage(dashboardMessage, post.status === 'published' ? 'Publicação salva e publicada.' : 'Rascunho salvo.');
  } catch (error) {
    if (coverPath) {
      try {
        const { error: cleanupError } = await supabase.storage.from('blog-images').remove([coverPath]);
        if (cleanupError) {
          showMessage(dashboardMessage, `${error.message || 'Não foi possível salvar a publicação.'} A imagem enviada também não pôde ser removida: ${cleanupError.message}`, true);
          return;
        }
      } catch (cleanupError) {
        showMessage(dashboardMessage, `${error.message || 'Não foi possível salvar a publicação.'} A limpeza da imagem também falhou: ${cleanupError.message || 'erro desconhecido'}`, true);
        return;
      }
    }
    showMessage(dashboardMessage, error.message || 'Não foi possível salvar a publicação.', true);
  } finally {
    saveButton.disabled = false;
  }
}

async function openDashboard() {
  const { data, error } = await supabase.rpc('is_blog_admin');
  if (error) throw error;
  if (!data) {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
    setSignedOut('Este usuário não tem permissão para administrar o blog.');
    return;
  }

  setSignedIn();
  try {
    await loadPosts();
  } catch (loadError) {
    showMessage(dashboardMessage, loadError.message || 'Não foi possível carregar as publicações.', true);
    postList.replaceChildren();
  }
}

async function start() {
  try {
    supabase = await getSupabase();
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    if (data.session) {
      try {
        await openDashboard();
      } catch (accessError) {
        setSignedOut(accessError.message || 'Não foi possível verificar o acesso de administrador.');
      }
    }
  } catch (error) {
    showMessage(loginMessage, error.message || 'Não foi possível iniciar o painel.', true);
    loginForm.querySelector('button[type="submit"]').disabled = true;
    return;
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = loginForm.querySelector('button[type="submit"]');
    button.disabled = true;
    loginMessage.hidden = true;

    try {
      const form = new FormData(loginForm);
      const { error } = await supabase.auth.signInWithPassword({
        email: String(form.get('email')).trim(),
        password: String(form.get('password'))
      });
      if (error) throw error;
      await openDashboard();
    } catch (error) {
      showMessage(loginMessage, error.message || 'Não foi possível entrar. Verifique o acesso e tente novamente.', true);
    } finally {
      button.disabled = false;
    }
  });

  postForm.addEventListener('submit', savePost);
  titleInput.addEventListener('input', () => {
    if (!slugWasEdited) slugInput.value = slugify(titleInput.value);
  });
  slugInput.addEventListener('input', () => {
    slugWasEdited = true;
  });
  document.querySelector('#admin-reset').addEventListener('click', resetEditor);
  document.querySelector('#admin-refresh').addEventListener('click', async () => {
    try {
      await loadPosts();
      showMessage(dashboardMessage, 'Lista atualizada.');
    } catch (error) {
      showMessage(dashboardMessage, error.message || 'Não foi possível atualizar a lista.', true);
    }
  });
  document.querySelector('#admin-signout').addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showMessage(dashboardMessage, error.message || 'Não foi possível encerrar a sessão.', true);
      return;
    }
    setSignedOut('Sessão encerrada.');
  });
  document.querySelector('#admin-password-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const password = String(values.get('password'));
    if (password !== String(values.get('confirm_password'))) {
      showMessage(dashboardMessage, 'As senhas não coincidem.', true);
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      form.reset();
      showMessage(dashboardMessage, 'Senha atualizada. Use essa senha nos próximos acessos.');
    } catch (error) {
      showMessage(dashboardMessage, error.message || 'Não foi possível atualizar a senha.', true);
    } finally {
      button.disabled = false;
    }
  });
}

start();
