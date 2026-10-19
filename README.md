# Coenel-DE

Site institucional estático da Coenel-DE com blog integrado ao Supabase.

## Executar localmente

No PowerShell, nesta pasta:

```powershell
.\iniciar-local.ps1
```

Abra `http://127.0.0.1:8000`. O servidor local mostra os arquivos do site; recursos do Supabase precisam de conexão à internet.

## Blog

- Blog público: `noticias.html`
- Painel administrativo: `admin.html`
- Configuração do Supabase: `assets/js/supabase-config.js`
- SQL de tabelas, políticas RLS e armazenamento: `supabase/blog-schema.sql`
- Instruções de configuração: `SUPABASE-SETUP.md`

A chave pública (`anon`/publishable) do Supabase é usada pelo navegador. Nunca adicione uma chave `service_role` ao código público, ao GitHub ou às configurações públicas do Vercel.

## Deploy no Vercel

O projeto não exige build. Importe o repositório GitHub no Vercel, selecione a pasta raiz e deixe **Build Command** vazio e **Output Directory** como `.`. O Vercel publicará os arquivos estáticos.

Configure o domínio de produção existente no projeto Vercel correto. Em **Supabase → Authentication → URL Configuration**, mantenha o domínio publicado e adicione `/admin.html` em **Redirect URLs**. Não substitua o domínio existente por um projeto de teste.
