const DEFAULT_PRODUCTS = [
  {id:1,name:"Smart Watch Pro",category:"Electronics",price:4999,icon:"⌚"},
  {id:2,name:"Wireless Headphones",category:"Electronics",price:2999,icon:"🎧"},
  {id:3,name:"Minimal Backpack",category:"Accessories",price:1899,icon:"🎒"},
  {id:4,name:"Classic Sneakers",category:"Fashion",price:3499,icon:"👟"},
  {id:5,name:"Ceramic Coffee Set",category:"Home",price:1299,icon:"☕"},
  {id:6,name:"Desk Lamp",category:"Home",price:1599,icon:"💡"},
  {id:7,name:"Everyday Hoodie",category:"Fashion",price:2299,icon:"🧥"},
  {id:8,name:"Travel Bottle",category:"Accessories",price:899,icon:"🧴"}
];

const state = {
  products: JSON.parse(localStorage.getItem("shopSphereProducts")) || DEFAULT_PRODUCTS,
  cart: JSON.parse(localStorage.getItem("shopSphereCart")) || [],
  wishlist: JSON.parse(localStorage.getItem("shopSphereWishlist")) || [],
  orders: JSON.parse(localStorage.getItem("shopSphereOrders")) || [],
  user: JSON.parse(localStorage.getItem("shopSphereUser")) || null
};

const $ = id => document.getElementById(id);
const money = value => `₹${Number(value).toLocaleString("en-IN")}`;
const save = () => {
  localStorage.setItem("shopSphereProducts", JSON.stringify(state.products));
  localStorage.setItem("shopSphereCart", JSON.stringify(state.cart));
  localStorage.setItem("shopSphereWishlist", JSON.stringify(state.wishlist));
  localStorage.setItem("shopSphereOrders", JSON.stringify(state.orders));
  localStorage.setItem("shopSphereUser", JSON.stringify(state.user));
};

function toast(message){
  $("toast").textContent = message;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 2200);
}

function renderCategories(){
  const current = $("categoryFilter").value;
  const categories = [...new Set(state.products.map(p => p.category))].sort();
  $("categoryFilter").innerHTML = `<option value="all">All categories</option>` +
    categories.map(c => `<option value="${c}">${c}</option>`).join("");
  $("categoryFilter").value = categories.includes(current) ? current : "all";
}

function renderProducts(){
  const query = $("searchInput").value.toLowerCase().trim();
  const category = $("categoryFilter").value;
  let list = state.products.filter(p =>
    (!query || `${p.name} ${p.category}`.toLowerCase().includes(query)) &&
    (category === "all" || p.category === category)
  );
  const sort = $("sortSelect").value;
  if(sort === "price-low") list.sort((a,b)=>a.price-b.price);
  if(sort === "price-high") list.sort((a,b)=>b.price-a.price);
  if(sort === "name") list.sort((a,b)=>a.name.localeCompare(b.name));

  $("productGrid").innerHTML = list.map(p => {
    const wished = state.wishlist.includes(p.id);
    return `<article class="product">
      <div class="product-visual">${p.icon}</div>
      <div class="product-body">
        <span class="product-category">${p.category}</span>
        <h3>${escapeHtml(p.name)}</h3>
        <div class="price">${money(p.price)}</div>
        <div class="product-actions">
          <button class="add-btn" onclick="addToCart(${p.id})">Add to cart</button>
          <button class="heart-btn ${wished ? "active":""}" onclick="toggleWishlist(${p.id})">${wished ? "♥":"♡"}</button>
        </div>
      </div>
    </article>`;
  }).join("");
  $("emptyProducts").classList.toggle("hidden", list.length > 0);
}

function renderCart(){
  $("cartCount").textContent = state.cart.reduce((s,i)=>s+i.qty,0);
  const total = state.cart.reduce((s,i)=>s+i.price*i.qty,0);
  $("cartTotal").textContent = money(total);
  $("cartItems").innerHTML = state.cart.length ? state.cart.map(i => `
    <div class="cart-row">
      <div class="cart-icon">${i.icon}</div>
      <div><h4>${escapeHtml(i.name)}</h4><div class="qty">
        <button onclick="changeQty(${i.id},-1)">−</button><span>${i.qty}</span><button onclick="changeQty(${i.id},1)">+</button>
        <button class="remove" onclick="removeFromCart(${i.id})">Remove</button>
      </div></div>
      <strong>${money(i.price*i.qty)}</strong>
    </div>`).join("") : `<p class="muted">Your cart is empty. Add something you like!</p>`;
}

function renderWishlist(){
  $("wishlistCount").textContent = state.wishlist.length;
  const items = state.products.filter(p => state.wishlist.includes(p.id));
  $("wishlistItems").innerHTML = items.length ? items.map(p => `
    <div class="cart-row">
      <div class="cart-icon">${p.icon}</div>
      <div><h4>${escapeHtml(p.name)}</h4><small>${money(p.price)}</small></div>
      <button class="remove" onclick="toggleWishlist(${p.id})">Remove</button>
    </div>`).join("") : `<p class="muted">No saved products yet.</p>`;
}

function renderOrders(){
  $("ordersList").innerHTML = state.orders.length ? state.orders.slice().reverse().map(o => `
    <div class="order"><div><strong>Order #${o.id}</strong><span class="muted">${o.date} · ${o.items} item(s)</span></div>
    <div><strong>${money(o.total)}</strong><span class="status">${o.status}</span></div></div>`).join("")
    : `<p class="muted">No orders yet. Your completed orders will appear here.</p>`;
}

function renderAdmin(){
  $("adminProducts").innerHTML = state.products.map(p => `
    <div class="admin-row">
      <strong>${p.icon} ${escapeHtml(p.name)}</strong>
      <span>${p.category}</span><span>${money(p.price)}</span>
      <button onclick="editProduct(${p.id})">Edit</button>
      <button class="delete" onclick="deleteProduct(${p.id})">Delete</button>
    </div>`).join("");
}

function renderAll(){ renderCategories(); renderProducts(); renderCart(); renderWishlist(); renderOrders(); renderAdmin(); updateAuthButton(); save(); }

function addToCart(id){
  const product = state.products.find(p=>p.id===id);
  const existing = state.cart.find(i=>i.id===id);
  existing ? existing.qty++ : state.cart.push({...product, qty:1});
  save(); renderCart(); toast(`${product.name} added to cart`);
}
function changeQty(id, delta){
  const item = state.cart.find(i=>i.id===id);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0) removeFromCart(id);
  else { save(); renderCart(); }
}
function removeFromCart(id){ state.cart = state.cart.filter(i=>i.id!==id); save(); renderCart(); toast("Item removed"); }
function toggleWishlist(id){
  state.wishlist = state.wishlist.includes(id) ? state.wishlist.filter(x=>x!==id) : [...state.wishlist,id];
  save(); renderProducts(); renderWishlist();
}
function openDrawer(id){ $("drawerBackdrop").classList.remove("hidden"); $(id).classList.add("open"); }
function closeDrawers(){ $("drawerBackdrop").classList.add("hidden"); document.querySelectorAll(".drawer").forEach(d=>d.classList.remove("open")); }

function openAuth(){
  $("modalBackdrop").classList.remove("hidden");
  $("modalTitle").textContent = state.user ? "Account" : "Welcome back";
  $("modalText").textContent = state.user ? `Signed in as ${state.user.email}` : "Sign in to continue.";
  if(state.user){
    $("authEmail").value = state.user.email;
    $("authPassword").value = "";
  }
}
function updateAuthButton(){ $("authBtn").textContent = state.user ? "Logout" : "Login"; }

$("authForm").addEventListener("submit", e => {
  e.preventDefault();
  if(state.user){ state.user=null; toast("You have been logged out."); }
  else {
    state.user={email:$("authEmail").value};
    toast("Demo login successful!");
  }
  save(); $("modalBackdrop").classList.add("hidden"); updateAuthButton();
});
$("authBtn").onclick = () => state.user ? (state.user=null, save(), updateAuthButton(), toast("Logged out")) : openAuth();

$("checkoutBtn").onclick = () => {
  if(!state.cart.length){ toast("Your cart is empty."); return; }
  if(!state.user){ $("cartDrawer").classList.remove("open"); $("drawerBackdrop").classList.add("hidden"); openAuth(); toast("Please login before placing an order."); return; }
  const total = state.cart.reduce((s,i)=>s+i.price*i.qty,0);
  state.orders.push({id:Date.now().toString().slice(-7),date:new Date().toLocaleDateString("en-IN"),items:state.cart.reduce((s,i)=>s+i.qty,0),total,status:"Confirmed"});
  state.cart=[]; save(); renderAll(); closeDrawers(); toast("Order placed successfully!");
};

$("searchInput").oninput=renderProducts;
$("categoryFilter").onchange=renderProducts;
$("sortSelect").onchange=renderProducts;
$("cartBtn").onclick=()=>openDrawer("cartDrawer");
$("wishlistBtn").onclick=()=>openDrawer("wishlistDrawer");
$("drawerBackdrop").onclick=closeDrawers;
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=closeDrawers);
$("modalClose").onclick=()=>$("modalBackdrop").classList.add("hidden");
$("modalBackdrop").onclick=e=>{if(e.target===$("modalBackdrop")) $("modalBackdrop").classList.add("hidden");};

$("addProductBtn").onclick=()=>openProductModal();
$("productModalClose").onclick=()=>$("productModalBackdrop").classList.add("hidden");
$("productForm").onsubmit=e=>{
  e.preventDefault();
  const id = $("productId").value;
  const data={name:$("productName").value.trim(),category:$("productCategory").value.trim(),price:Number($("productPrice").value),icon:$("productIcon").value.trim()};
  if(id){ const index=state.products.findIndex(p=>p.id===Number(id)); state.products[index]={...state.products[index],...data}; toast("Product updated"); }
  else { data.id=Date.now(); state.products.push(data); toast("Product added"); }
  $("productModalBackdrop").classList.add("hidden"); renderAll();
};
function openProductModal(product=null){
  $("productModalTitle").textContent=product?"Edit product":"Add product";
  $("productId").value=product?.id||"";
  $("productName").value=product?.name||"";
  $("productCategory").value=product?.category||"";
  $("productPrice").value=product?.price||"";
  $("productIcon").value=product?.icon||"";
  $("productModalBackdrop").classList.remove("hidden");
}
function editProduct(id){ openProductModal(state.products.find(p=>p.id===id)); }
function deleteProduct(id){
  const product=state.products.find(p=>p.id===id);
  if(!confirm(`Delete ${product.name}?`)) return;
  state.products=state.products.filter(p=>p.id!==id);
  state.cart=state.cart.filter(p=>p.id!==id);
  state.wishlist=state.wishlist.filter(x=>x!==id);
  renderAll(); toast("Product deleted");
}
function escapeHtml(value){
  return String(value).replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}
renderAll();