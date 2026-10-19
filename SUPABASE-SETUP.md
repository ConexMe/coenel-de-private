# Configuração do blog com Supabase

O site continua estático no Vercel. O Supabase fornece autenticação, banco de dados e armazenamento das imagens do blog.

## 1. Criar o projeto

Crie um projeto no [Supabase](https://supabase.com/) e aguarde a criação do banco.

## 2. Criar as tabelas e as políticas de acesso

No painel do Supabase, abra **SQL Editor**, crie uma consulta, cole o conteúdo de [`supabase/blog-schema.sql`](./supabase/blog-schema.sql) e execute.

O script cria a tabela de publicações, protege as operações com Row Level Security e configura o bucket público de imagens. Apenas os e-mails adicionados à lista `blog_admins` poderão entrar no painel e alterar conteúdo.

## 3. Configurar os endereços de autenticação

Em **Authentication → URL Configuration**:

- Defina **Site URL** para o endereço publicado do site, por exemplo `https://www.coenel-de.com.br`.
- Adicione à lista **Redirect URLs** o endereço do painel publicado: `https://www.coenel-de.com.br/admin.html`.
- Para desenvolvimento local, adicione também `http://127.0.0.1:8000/admin.html`.

O link de convite deve levar ao painel (`admin.html`) para que o administrador aceite o convite e defina sua senha.

## 4. Convidar o administrador

Em **Authentication → Users**, convide o e-mail do administrador. Depois, no **SQL Editor**, autorize exatamente esse e-mail (em minúsculas):

```sql
insert into public.blog_admins (email)
values (lower('admin@exemplo.com'))
on conflict (email) do nothing;
```

Substitua `admin@exemplo.com` pelo e-mail convidado. O administrador abre o link recebido, define uma senha com pelo menos 12 caracteres no painel e poderá entrar novamente em `admin.html` com e-mail e senha. Para remover o acesso, apague o e-mail da tabela `public.blog_admins`.

## 5. Conectar o site

No Supabase, abra **Project Settings → API** e copie o **Project URL** e a chave pública **anon/publishable**. Preencha os dois valores em `assets/js/supabase-config.js`:

```js
export const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
export const SUPABASE_ANON_KEY = 'SUA-CHAVE-PUBLICA';
```

A URL e a chave `anon`/publishable são usadas no navegador. Nunca coloque a chave `service_role` nesse arquivo, no HTML ou em variáveis públicas do Vercel.

## 6. Testar localmente e publicar

Execute `.\iniciar-local.ps1` no PowerShell e abra `http://127.0.0.1:8000/noticias.html` ou `http://127.0.0.1:8000/admin.html`. A conexão com Supabase e a biblioteca JavaScript do cliente precisam de internet.

Depois de validar o painel, publique os arquivos atualizados no Vercel. Confirme que os endereços publicados estão na lista de **Redirect URLs** do Supabase.

## Recursos do painel

- Criar, editar e apagar publicações.
- Salvar como rascunho ou publicar imediatamente.
- Categoria, URL amigável, resumo, conteúdo em parágrafos e imagem de capa.
- Upload de capas JPG, PNG e WebP de até 5 MB.
- A listagem pública mostra apenas publicações publicadas; rascunhos e ações administrativas exigem uma sessão autorizada.
