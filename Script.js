// ---------- Config ----------
const USERS_KEY = 'premium_baju_users_v2';
const LOGIN_KEY = 'premium_baju_login_v2';
const PRODUCTS = [
  { id:'p1', title:'Arid Tee - Midnight Black', price:89.00,
    images:['assets/images/images1.jpeg','assets/images/images2.jpeg'],
    colors:['Black','White','Olive'], sizes:['XS','S','M','L','XL']
  },
  { id:'p2', title:'Breeze Polo - Stone', price:109.00,
    images:['assets/images/images3.jpeg','assets/images/images4.jpeg'],
    colors:['Stone','Navy'], sizes:['S','M','L','XL']
  },
  { id:'p3', title:'Linen Overshirt - Sand', price:149.00,
    images:['assets/images/images5.jpeg','assets/images/images6.jpeg'],
    colors:['Sand','Olive'], sizes:['M','L','XL']
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

// ---------- Render auth + cart count ----------
function renderAuthTop(){
  const slot = document.getElementById('authTop');
  const user = getCurrent();
  if(!slot) return;

  if(user){
    const name = user.name || user.email.split('@')[0];
    slot.innerHTML = `<div class="flex items-center gap-3">
      <div class="text-sm">Hi, <span class="font-medium">${name}</span></div>
      <button class="px-3 py-1 rounded bg-white text-black text-sm logoutBtn">Logout</button>
    </div>`;
    slot.querySelector('.logoutBtn').addEventListener('click', ()=>{
      setCurrent(null);
      renderAuthTop();
      window.location.replace('index.html');
    });
  } else {
    slot.innerHTML = `<a href="index.html" class="px-3 py-1 rounded bg-white text-black text-sm">Login</a>`;
  }

  const countEl = document.getElementById('cartCountTop');
  if(countEl) countEl.innerText = user ? loadCartFor(user.email).reduce((s,i)=>s+(i.qty||0),0) : '0';
}

// ---------- Home page ----------
function initHome(){
  const hero=document.getElementById('heroImg');
  if(hero){
    const imgs=[
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1600&auto=format&fit=crop',
      'assets/images/logo1.jpg',
      'assets/images/logo.png'
    ];
    let i=0;
    setInterval(()=>{
      i=(i+1)%imgs.length;
      hero.style.opacity=0;
      setTimeout(()=>{ hero.src=imgs[i]; hero.style.opacity=1; },300);
    },3500);
  }

  const fg=document.getElementById('featuredGrid');
  if(fg){
    PRODUCTS.forEach(p=>{
      const d=document.createElement('div');
      d.className='bg-white rounded-lg p-4 card-shadow';
      d.innerHTML=`<img src="${p.images[0]}" class="w-full h-48 object-cover rounded"/>
        <div class="mt-3 flex justify-between items-start">
          <div class="font-semibold">${p.title}</div>
          <div class="text-sm text-gray-500">RM${p.price.toFixed(2)}</div>
        </div>`;
      fg.appendChild(d);
    });
  }
}

// ---------- Products page ----------
function initProducts(){
  const list=document.getElementById('productGrid')||document.getElementById('productList'); 
  if(!list) return;
  list.innerHTML='';

  PRODUCTS.forEach(p=>{
    const card=document.createElement('div');
    card.className='bg-white rounded-lg p-4 card-shadow';
    card.innerHTML=`
      <div class="relative">
        <img src="${p.images[0]}" data-images='${JSON.stringify(p.images)}' class="w-full h-56 object-cover rounded product-img" />
      </div>
      <div class="mt-3">
        <div class="flex justify-between items-start">
          <div class="font-semibold">${p.title}</div>
          <div class="text-sm text-gray-500">RM${p.price.toFixed(2)}</div>
        </div>
        <p class="text-xs text-gray-500 mt-2">Colors: ${p.colors.join(', ')}</p>
        <div class="mt-3 grid grid-cols-2 gap-2">
          <select data-id="${p.id}" class="sel-color p-2 rounded border"><option value="">Pilih warna</option>${p.colors.map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
          <select data-id="${p.id}" class="sel-size p-2 rounded border"><option value="">Pilih size</option>${p.sizes.map(s=>`<option value="${s}">${s}</option>`).join('')}</select>
        </div>
        <div class="mt-3 flex items-center gap-2">
          <input type="number" min="1" value="1" data-id="${p.id}" class="qty p-2 rounded border w-20" />
          <button class="addBtn flex-1 px-3 py-2 rounded bg-turquoise-500 text-white" data-id="${p.id}">Add to cart</button>
        </div>
      </div>`;
    list.appendChild(card);

    const imgEl = card.querySelector('.product-img'); 
    const imgs = JSON.parse(imgEl.getAttribute('data-images')); 
    let idx=0;
    setInterval(()=>{ 
      idx=(idx+1)%imgs.length; 
      imgEl.style.opacity=0; 
      setTimeout(()=>{ imgEl.src=imgs[idx]; imgEl.style.opacity=1; },250); 
    },3000);
  });

  setTimeout(()=>{
    document.querySelectorAll('.addBtn').forEach(b=>{
      b.addEventListener('click',e=>{
        const id=e.currentTarget.dataset.id;
        const qty=Number(document.querySelector(`.qty[data-id="${id}"]`).value)||1;
        const color=document.querySelector(`.sel-color[data-id="${id}"]`).value;
        const size=document.querySelector(`.sel-size[data-id="${id}"]`).value;
        const cur=getCurrent(); if(!cur){ window.location.replace('index.html'); return; }
        if(!color||!size){ alert('Sila pilih warna & size'); return; }
        const cart=loadCartFor(cur.email);
        const exist=cart.find(it=>it.productId===id && it.color===color && it.size===size);
        if(exist) exist.qty+=qty; 
        else cart.push({ productId:id, qty, color, size, name: PRODUCTS.find(x=>x.id===id).title, price: PRODUCTS.find(x=>x.id===id).price });
        saveCartFor(cur.email, cart); renderAuthTop();
        e.currentTarget.innerText='Added ✓'; setTimeout(()=> e.currentTarget.innerText='Add to cart',1000);
      });
    });
  },200);
}

// ---------- Cart page with editable quantity ----------
function initCart(){
  const cur = getCurrent(); if(!cur) return;
  const container = document.getElementById('cartContainer'); if(!container) return;
  const cart = loadCartFor(cur.email);

  container.innerHTML='';
  if(cart.length===0){
    container.innerHTML='<div class="text-gray-500">Your cart is empty.</div>';
    document.getElementById('cartTotal').innerText='RM0.00';
    return;
  }

  let total=0;
  cart.forEach((item,index)=>{
    const p = PRODUCTS.find(x=>x.id===item.productId);
    if(!p) return;
    const subtotal = item.qty*p.price;
    total += subtotal;

    const div = document.createElement('div');
    div.className='flex gap-4 items-center border rounded p-3';
    div.innerHTML=`
      <img src="${p.images[0]}" class="w-20 h-20 object-cover rounded"/>
      <div class="flex-1">
        <div class="font-semibold">${item.name}</div>
        <div class="text-xs text-gray-500">Color: ${item.color} | Size: ${item.size}</div>
        <div class="mt-1 flex items-center gap-2">
          RM${item.price.toFixed(2)} x 
          <input type="number" min="1" value="${item.qty}" data-index="${index}" class="cartQty w-16 p-1 border rounded"/>
          = RM<span class="subtotal">${subtotal.toFixed(2)}</span>
        </div>
      </div>
      <button class="removeBtn px-2 py-1 rounded bg-red-500 text-white" data-id="${item.productId}" data-color="${item.color}" data-size="${item.size}">Remove</button>
    `;
    container.appendChild(div);
  });

  // Update total
  const totalEl = document.getElementById('cartTotal');
  totalEl.innerText='RM'+total.toFixed(2);

  // Remove item
  container.querySelectorAll('.removeBtn').forEach(b=>{
    b.addEventListener('click',e=>{
      const id=e.currentTarget.dataset.id;
      const color=e.currentTarget.dataset.color;
      const size=e.currentTarget.dataset.size;
      const newCart = cart.filter(it=>!(it.productId===id && it.color===color && it.size===size));
      saveCartFor(cur.email, newCart);
      renderAuthTop();
      initCart();
    });
  });

  // Editable quantity
  container.querySelectorAll('.cartQty').forEach(input=>{
    input.addEventListener('input', e=>{
      const idx = Number(e.target.dataset.index);
      let val = Number(e.target.value);
      if(val < 1) val = 1; // minimum 1
      cart[idx].qty = val;
      saveCartFor(cur.email, cart);

      // update subtotal for that item
      const subtotalEl = e.target.parentElement.querySelector('.subtotal');
      const price = cart[idx].price;
      subtotalEl.innerText = (price*val).toFixed(2);

      // update total
      const newTotal = cart.reduce((sum,it)=>sum+it.price*it.qty,0);
      totalEl.innerText = 'RM'+newTotal.toFixed(2);

      renderAuthTop(); // update header cart count
    });
  });

  // Clear cart
  const clearBtn=document.getElementById('clearCartPage');
  if(clearBtn) clearBtn.addEventListener('click',()=>{
    saveCartFor(cur.email, []);
    renderAuthTop();
    initCart();
  });
}

// ---------- Checkout page ----------
function initCheckout(){
  const cur=getCurrent(); if(!cur) return;
  const container = document.getElementById('cartPageList'); if(!container) return;
  const cart = loadCartFor(cur.email);

  container.innerHTML='';
  if(cart.length===0){
    container.innerHTML='<div class="text-gray-500">Your cart is empty.</div>';
    return;
  }

  let total=0;
  cart.forEach(item=>{
    const p = PRODUCTS.find(x=>x.id===item.productId);
    if(!p) return;
    const subtotal = item.qty*p.price;
    total += subtotal;
    const div=document.createElement('div');
    div.className='flex justify-between items-center border rounded p-3';
    div.innerHTML=`
      <div>${item.name} (${item.color}/${item.size}) x ${item.qty}</div>
      <div>RM${subtotal.toFixed(2)}</div>
    `;
    container.appendChild(div);
  });

  const btn=document.getElementById('gotoCheckout');
  if(btn){
    btn.addEventListener('click',()=>{
      const payment = document.querySelector('input[name="payment"]:checked');
      if(!payment){ alert('Sila pilih kaedah pembayaran'); return; }
      alert(`Order placed! Total: RM${total.toFixed(2)}, Payment: ${payment.value}`);
      // kosongkan cart
      saveCartFor(cur.email, []);
      renderAuthTop();
      window.location.replace('home.html');
    });
  }
}

// ---------- DOMContentLoaded ----------
document.addEventListener('DOMContentLoaded', ()=>{
  const user = getCurrent();
  const page = window.location.pathname.split('/').pop().toLowerCase();
  const loginPages = ['index.html','register.html',''];

  if(!user && !loginPages.includes(page)){
    window.location.replace('index.html'); return;
  }
  if(user && loginPages.includes(page)){
    window.location.replace('home.html'); return;
  }

  renderAuthTop();

  if(page==='' || page==='home.html') initHome();
  if(page==='product.html') initProducts();
  if(page==='cart.html') initCart();
  if(page==='checkout.html') initCheckout();
});
