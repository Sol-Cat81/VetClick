(async ()=>{
  const fs = require('fs');
  const path = require('path');
  const dbPath = path.resolve(__dirname, './config/database.js');
  // fake DB module
  const fakeDb = {
    async query(sql, params=[]) {
      console.log('SQL:', sql.split('\n')[0].slice(0,200), 'params=', params);
      if (sql.trim().toUpperCase().startsWith('SELECT')) return [ [] ];
      return [ { insertId: Math.floor(Math.random()*1000)+1 } ];
    },
    async getConnection() { return {
      async beginTransaction(){}, async commit(){}, async rollback(){}, release(){},
      async query(sql, params=[]) { console.log('TX SQL:', sql.split('\n')[0].slice(0,200)); return [ { insertId: Math.floor(Math.random()*1000)+1 } ]; }
    }; }
  };
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: fakeDb };
  const AdminModel = require('./models/admin.model');
  const mText = fs.readFileSync(path.resolve(__dirname,'./models/admin.model.js'),'utf8');
  const found = mText.match(/const inserciones = \{([\s\S]*?)\n\};/);
  if (!found) { console.error('no inserciones'); process.exit(1); }
  const content = found[1];
  const ks = [...content.matchAll(/([a-zA-Z0-9_]+)\s*:\s*\{/g)].map(m=>m[1]);
  console.log('Found inserciones keys:', ks);
  for (const key of ks) {
    console.log('\n--- Testing', key);
    const req = {};
    const reqMatch = content.match(new RegExp(key + "\\s*:\\s*\\{[\\s\\S]*?requeridos:\\s*\\[([^\\]]*)\\]","m"));
    const requeridos = reqMatch ? reqMatch[1].split(',').map(s=>s.replace(/[\'\"\s]/g,'')).filter(Boolean) : [];
    requeridos.forEach(f=>{ if (f.startsWith('id_')||f.includes('id_')) req[f]=1; else if (f.includes('nombre')||f.includes('tipo')||f.includes('descripcion')||f.includes('estado')) req[f]='Prueba'; else req[f]=1 });
    try {
      const res = await AdminModel.crear(key, req);
      console.log('Result insertId=', res && res.insertId);
    } catch (e) {
      console.error('Error for', key, e && e.message);
    }
  }
})();
