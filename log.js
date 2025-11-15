// ---------- Config ----------
const USERS_KEY = 'premium_baju_users_v2';
const LOGIN_KEY = 'premium_baju_login_v2';
const PRODUCTS = [
  { id:'p1', title:'Arid Tee - Midnight Black', price:89.00,
    images:['https://via.placeholder.com/200x200?text=Arid+1','https://via.placeholder.com/200x200?text=Arid+2'],
    colors:['Black','White','Olive'], sizes:['XS','S','M','L','XL']
  },
  { id:'p2', title:'Breeze Polo - Stone', price:109.00,
    images:['https://via.placeholder.com/200x200?text=Breeze+1','https://via.placeholder.com/200x200?text=Breeze+2'],
    colors:['Stone','Navy'], sizes:['S','M','L','XL']
  }
];

// ---------- LocalStorage helpers ----------
function loadUsers(){ try{return JSON.parse(localStorage.getItem(USERS_KEY)||'{}');}catch(e){return {};} }
function saveUsers(u){ localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function getCurrent(){ return JSON.parse(localStorage.getItem(LOGIN_KEY)||'null'); }
function setCurrent(u){ if(u) localStorage.setItem(LOGIN_KEY, JSON.stringify(u)); else localStorage.removeItem(LOGIN_KEY); }
function cartKeyFor(email){ return `premium_baju_cart_${email}`; }
function loadCartFor(email){ try{return JSON.parse(localStorage.getItem(cartKeyFor(email))||'[]');}catch(e){return [];} }
function saveCartFor(email, cart){ localStorage.setItem(cartKeyFor(email), JSON.stringify(cart)); }

// ---------- Auth Guard ----------
document.addEventListener('DOMContentLoaded', ()=> {
  const user = getCurrent();
  const page = window.location.pathname.split('/').pop().toLowerCase();
  const loginPages = ['index.html','register.html','']; // '' treat root

  if(!user && !loginPages.includes(page)){
    window.location.replace('index.html');
    return;
  }
  if(user && loginPages.includes(page)){
    window.location.replace('home.html');
    return;
  }
});

// ---------- Auth Forms ----------
const lf = document.getElementById('loginForm');
if(lf){
  lf.addEventListener('submit', e=>{
    e.preventDefault();
    const email = (document.getElementById('loginEmail')?.value||'').trim().toLowerCase();
    const pass = (document.getElementById('loginPassword')?.value||'').trim();
    if(!email||!pass){ alert('Isi email & password'); return; }
    const users = loadUsers();
    if(!users[email] || users[email].password !== pass){
      alert('Email/password tidak wujud. Sila register.');
      return;
    }
    setCurrent({ email, name: users[email].name||'' });
    setTimeout(()=> window.location.replace('home.html'), 50);
  });
}

const rf = document.getElementById('registerForm');
if(rf){
  rf.addEventListener('submit', e=>{
    e.preventDefault();
    const name = (document.getElementById('regName')?.value||'').trim();
    const email = (document.getElementById('regEmail')?.value||'').trim().toLowerCase();
    const pass = (document.getElementById('regPassword')?.value||'').trim();
    if(!name||!email||!pass){ alert('Sila isi semua maklumat'); return; }
    if(pass.length < 6){ alert('Password mesti 6 aksara'); return; }
    const users = loadUsers();
    if(users[email]){ alert('Email sudah wujud'); return; }
    users[email] = { name, email, password: pass };
    saveUsers(users);
    saveCartFor(email, []);
    alert('Pendaftaran berjaya — sila login untuk terus masuk.');
    window.location.replace('index.html');
  });
}

// ---------- Header auth + cart ----------
function renderAuthTop() {
  const slot = document.getElementById('authTop');
  if(!slot) return;
  const user = getCurrent();
  if(user){
    const name = user.name || user.email.split('@')[0];
    slot.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="text-sm">Hi, <span class="font-medium">${name}</span></div>
        <button id="logoutBtn" class="px-3 py-1 rounded bg-red-500 text-white text-sm">Logout</button>
      </div>
    `;
    document.getElementById('logoutBtn').addEventListener('click', ()=>{
      setCurrent(null);
      window.location.replace('index.html');
    });
  } else {
    slot.innerHTML = `<a href="index.html" class="px-3 py-1 rounded bg-blue-500 text-white text-sm">Login</a>`;
  }
}

// ---------- Products ----------
function initProducts(){
  const list = document.getElementById('productGrid');
  if(!list) return;
  list.innerHTML = '';
  PRODUCTS.forEach(p=>{
    const div = document.createElement('div');
    div.className = 'bg-white p-4 rounded shadow';
    div.innerHTML = `
      <img src="${p.images[0]}" class="w-full h-32 object-cover mb-2 rounded"/>
      <div class="font-semibold">${p.title}</div>
      <div class="text-sm text-gray-500">RM${p.price.toFixed(2)}</div>
      <div class="mt-2 flex gap-2">
        <select data-id="${p.id}" class="sel-color border p-1 rounded"><option value="">Color</option>${p.colors.map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
        <select data-id="${p.id}" class="sel-size border p-1 rounded"><option value="">Size</option>${p.sizes.map(s=>`<option value="${s}">${s}</option>`).join('')}</select>
      </div>
      <div class="mt-2 flex gap-2">
        <input type="number" min="1" value="1" data-id="${p.id}" class="qty border p-1 rounded w-16"/>
        <button class="addBtn bg-green-500 text-white px-2 rounded" data-id="${p.id}">Add</button>
      </div>
    `;
    list.appendChild(div);
  });

  setTimeout(()=>{
    document.querySelectorAll('.addBtn').forEach(b=>{
      b.addEventListener('click', e=>{
        const id = e.currentTarget.dataset.id;
        const qty = Number(document.querySelector(`.qty[data-id="${id}"]`).value)||1;
        const color = document.querySelector(`.sel-color[data-id="${id}"]`).value;
        const size = document.querySelector(`.sel-size[data-id="${id}"]`).value;
        const cur = getCurrent();
        if(!cur){ alert('Sila login'); return; }
        if(!color || !size){ alert('Pilih color & size'); return; }
        const cart = loadCartFor(cur.email);
        const exist = cart.find(it=>it.productId===id && it.color===color && it.size===size);
        if(exist) exist.qty += qty;
        else cart.push({ productId:id, qty, color, size, name: p.title, price: p.price });
        saveCartFor(cur.email, cart);
        renderCart();
      });
    });
  },100);
}

// ---------- Cart ----------
function renderCart(){
  const wrap = document.getElementById('cartContainer');
  if(!wrap) return;
  const cur = getCurrent();
  if(!cur){ wrap.innerHTML = 'Sila login'; return; }
  const cart = loadCartFor(cur.email)||[];
  wrap.innerHTML = '';
  let total = 0;
  cart.forEach((it, idx)=>{
    const sub = it.qty * it.price;
    total += sub;
    const div = document.createElement('div');
    div.className = 'flex items-center gap-2 p-2 border rounded';
    div.innerHTML = `
      <div class="flex-1">${it.name} (${it.color}/${it.size})</div>
      <input type="number" min="1" value="${it.qty}" data-idx="${idx}" class="border p-1 w-16 cart-qty"/>
      <div>RM${sub.toFixed(2)}</div>
      <button data-idx="${idx}" class="text-red-500 removeBtn">Remove</button>
    `;
    wrap.appendChild(div);
  });
  const totalEl = document.getElementById('cartTotal');
  if(totalEl) totalEl.innerText = 'RM' + total.toFixed(2);

  // Qty change
  document.querySelectorAll('.cart-qty').forEach(input=>{
    input.addEventListener('change', e=>{
      const idx = Number(e.target.dataset.idx);
      cart[idx].qty = Number(e.target.value)||1;
      saveCartFor(cur.email, cart);
      renderCart();
    });
  });

  // Remove
  document.querySelectorAll('.removeBtn').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const idx = Number(e.target.dataset.idx);
      cart.splice(idx,1);
      saveCartFor(cur.email, cart);
      renderCart();
    });
  });
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', ()=>{
  renderAuthTop();
  initProducts();
  renderCart();
});
