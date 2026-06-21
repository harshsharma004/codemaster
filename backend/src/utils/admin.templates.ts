export const adminLoginTemplate = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>CodeMaster Admin</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; background:#f4f5f7; color:#1f2933; margin:0; }
    main { max-width: 28rem; margin: 4rem auto; background:#fff; border:1px solid #d9e2ec; border-radius:16px; padding:2rem; box-shadow:0 10px 30px rgba(15,23,42,.08); }
    h1 { margin:0 0 1rem; font-size:1.6rem; }
    label { display:block; margin-top:1rem; font-weight:600; }
    input { width:100%; box-sizing:border-box; margin-top:.4rem; padding:.75rem .85rem; border:1px solid #bcccdc; border-radius:10px; }
    button { margin-top:1.25rem; width:100%; padding:.8rem .95rem; border:0; border-radius:10px; background:#0f172a; color:#fff; font-weight:700; cursor:pointer; }
    .error { color:#b00020; margin:0 0 1rem; }
    .meta { color:#52606d; font-size:.95rem; line-height:1.5; }
  </style>
</head>
<body>
  <main>
    <h1>CodeMaster Admin</h1>
    <p class="meta">Sign in with an explicitly allow-listed admin account.</p>
    {{if Error}}<p class="error">{{Error}}</p>{{endif}}
    <form method="post" action="/admin/login">
      <label for="email">Email</label>
      <input id="email" name="email" type="email" autocomplete="username" required>
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required>
      <button type="submit">Sign in</button>
    </form>
  </main>
</body>
</html>`;

export const adminHomeTemplate = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>CodeMaster Admin</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; background:#f4f5f7; color:#1f2933; margin:0; }
    header { display:flex; justify-content:space-between; align-items:center; padding:1rem 1.5rem; background:#0f172a; color:#fff; }
    header form { margin:0; }
    header button { border:0; border-radius:10px; background:#fff; color:#0f172a; padding:.6rem .9rem; font-weight:700; cursor:pointer; }
    main { max-width: 72rem; margin: 2rem auto; padding: 0 1.5rem 2rem; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(14rem, 1fr)); gap:1rem; }
    .card { background:#fff; border:1px solid #d9e2ec; border-radius:16px; padding:1rem 1.1rem; box-shadow:0 10px 30px rgba(15,23,42,.06); }
    .card a { text-decoration:none; color:inherit; display:block; }
    .count { font-size:2rem; font-weight:800; margin:.25rem 0 .5rem; }
    .muted { color:#52606d; }
  </style>
</head>
<body>
  <header>
    <div>
      <strong>CodeMaster Admin</strong><br>
      <span>Signed in as {{Email}}</span>
    </div>
    <form method="post" action="/admin/logout"><button type="submit">Log out</button></form>
  </header>
  <main>
    <h1>Data Explorer</h1>
    <p class="muted">Read-only operational views for every migrated backend model.</p>
    <section class="grid">
      {{Resources}}
    </section>
  </main>
</body>
</html>`;

export const renderTemplate = (template: string, data: any) => {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    if (key === 'Error') {
      if (value) {
        result = result.replace('{{if Error}}<p class="error">{{Error}}</p>{{endif}}', `<p class="error">${value}</p>`);
      } else {
        result = result.replace('{{if Error}}<p class="error">{{Error}}</p>{{endif}}', '');
      }
    } else {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
  }
  return result;
};
