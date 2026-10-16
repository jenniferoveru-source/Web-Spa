// --- DESIGN TOKENS & ESTADO --- 
// DS: Configuración centralizada de estilos (colores, fuentes, sombras) para mantener la consistencia visual.
const DS = {
  gold: '#b8963e', goldLight: '#d4af6a', goldPale: '#f0e4c4',
  sage: '#7a9e7e', sagePale: '#e8f0e9',
  terra: '#c17a5a', terraPale: '#f5e8e0',
  border: '#e0d5c0', card: '#fdf8f0', surface: '#fffdf8', text: '#2c2416',
  textMid: '#5a4e3a', textLight: '#9a8b78',
  bg: '#f5f0e8', bgDark: '#1a1610',
  danger:'#b94040',
  fontHead: "'Cormorant Garamond', serif",
  fontBody: "'Jost', sans-serif",
  radius: '2px', radiusMd: '7px',
  shadow: '0 4px 24px rgba(44,36,22,.10)',
  shadowLg: '0 12px 48px rgba(44,36,22,.16)'
};

// state: Objeto que contiene toda la información de la aplicación (datos de reservas, vista actual, filtros).
let state = {
  vista: "hotel",
  reservasHotel: [], reservasSpa: [], reservasMasajes: [],
  isBookingActive: false,
  isViewingExisting: false,
  favoritos: [],
  calendarMonth: new Date().getMonth(),
  calendarYear: new Date().getFullYear(),
  nextIdSpa: 1, nextIdMasajes: 1,
  searchTimer: null, // Temporizador para el debounce de búsqueda
  buscadorNombre: '',
  form: { huesped: '', fecha: '', tipoReserva: 'hotel', servicio: '' }
};

// Listados estáticos de servicios para Spa y Masajes.
const SPA_TRATAMIENTOS = [
  { label: 'Masaje relajante', descripcion: 'Descontracturante con aceites esenciales.' },
  { label: 'Facial revitalizante', descripcion: 'Limpieza profunda y tonificación.' },
  { label: 'Circuito hidroterapia', descripcion: 'Sauna, piscina, jacuzzi y duchas especiales.' },
  { label: 'Aromaterapia', descripcion: 'Tratamiento sensorial con esencias naturales.' },
  { label: 'Ritual de bienestar', descripcion: 'Exfoliación corporal y envoltura mineral.' },
  { label: 'Yoga & Meditación', descripcion: 'Sesión guiada de respiración y estiramientos.' }
];

const MASAJES_LISTA = [
  { label: 'Masaje sueco', descripcion: 'Técnica tradicional. 60 minutos.' },
  { label: 'Masaje tailandés', descripcion: 'Estiramientos y digitopresión.' },
  { label: 'Masaje tejido profundo', descripcion: 'Presión firme para liberar tensión crónica.' },
  { label: 'Masaje piedras calientes', descripcion: 'Piedras volcánicas para relajación profunda.' },
  { label: 'Masaje deportivo', descripcion: 'Ideal para recuperación muscular y flexibilidad.' },
  { label: 'Masaje prenatal', descripcion: 'Alivio de tensiones y bienestar para futuras madres.' }
];

// =========== HELPERS =================
// Función utilitaria para crear elementos del DOM de forma declarativa con estilos y atributos.
function el(tag, opts = {}) {
  const node = document.createElement(tag);
  if (opts.styles) Object.assign(node.style, opts.styles);
  if (opts.attrs) Object.entries(opts.attrs).forEach(([k, v]) => node.setAttribute(k, v));
  if (opts.text) node.textContent = opts.text;
  if (opts.html) node.innerHTML = opts.html;
  return node;
}

// Atajo para seleccionar elementos (como jQuery).
const $ = sel => document.querySelector(sel);

// d(n): Retorna una fecha ISO (YYYY-MM-DD) sumando 'n' días a la fecha actual.
function d(n){const h=new Date();return new Date(h.getTime()+n*864e5).toISOString().slice(0,10);}

// formatFecha(iso): Convierte una fecha ISO a un formato legible en español (ej: 23 abr. 2026).
function formatFecha(iso){if(!iso)return '';const[y,m,d]=iso.split('-'),M=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];return `${parseInt(d)} ${M[parseInt(m)-1]}. ${y}`;}

// ========== INIT UI ================
// buildUI: Función principal que construye la estructura base de la página (Header, Nav, Formulario y Panel Principal).
function buildUI(){
  insertarKeyframes();
  const app = $('#app');
  app.innerHTML = '';
  Object.assign(app.style,{maxWidth:'1300px',margin:'0 auto',padding:'0 32px 80px',position:'relative',zIndex:1,fontFamily:DS.fontBody});
  if(!$('#gold-bar')){
    const topBar = el('div',{styles:{
      position:'fixed',top:0,left:0,right:0,height:'3px',zIndex:'100',
      background:`linear-gradient(90deg,${DS.gold},${DS.goldLight},${DS.sage},${DS.gold})`}});
    topBar.id = 'gold-bar'; document.body.appendChild(topBar);
    const bgTex = el('div',{styles:{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',
      background:`radial-gradient(ellipse 70% 50% at 10% 20%, rgba(185,150,62,.06) 0%,transparent 60%),
      radial-gradient(ellipse 50% 60% at 90% 80%, rgba(122,158,126,.06) 0%,transparent 60%)`}});
    bgTex.id='bg-tex';document.body.appendChild(bgTex);
  }
  app.appendChild(buildHeader());
  app.appendChild(buildNavTabs());
  const layout = el('div',{styles:{display:'grid',gap:'44px',marginTop:'30px',
      gridTemplateColumns:window.innerWidth<=900?'1fr':'340px 1fr',alignItems:'start'}});
  layout.appendChild(buildFormPanel());
  layout.appendChild(el('div',{attrs:{id:'main-panel'}}));
  app.appendChild(layout);
  renderVista();
}

// ============== NAV BUTTONS CON COLOR ===============
// buildNavTabs: Genera los botones de navegación (Hotel, Spa, Masajes) con estilos dinámicos según la pestaña activa.
function buildNavTabs() {
  const nav = el('nav',{styles:{display:'flex',gap:'20px',margin:'28px 0 22px 0',border:'none'}});
  const colorTabs = {
    hotel:   { bg: DS.gold,    color: '#fff' },
    spa:     { bg: DS.sage,    color: '#fff' },
    masajes: { bg: DS.terra,   color: '#fff' }
  };
  ['hotel','spa','masajes'].forEach(key=>{
    const activo = state.vista === key;
    const config = colorTabs[key];
    const btn = el('button',{
      text: key.charAt(0).toUpperCase()+key.slice(1),
      styles: {
        padding: '13px 35px',fontFamily: DS.fontBody,fontWeight:'600',fontSize:'1.10rem',letterSpacing:'.12em',
        background: activo?config.bg:'transparent',color:activo?config.color:DS.textMid,
        border: `2px solid ${activo?config.bg:DS.border}`,
        borderBottom: activo ? `5px solid ${config.bg}` : `2px solid ${DS.border}`,
        borderRadius: '8px',cursor:'pointer',transition:'all .18s',
        boxShadow: activo ? `0 4px 22px ${config.bg}33` : 'none',
        outline: activo ? `2px solid ${config.bg}44`:'none',outlineOffset:activo?'2px':'0'
      }
    });
    btn.onclick=()=>{state.vista=key;state.form.tipoReserva=key;state.isBookingActive=false;state.isViewingExisting=false;state.buscadorNombre='';buildUI();}
    nav.appendChild(btn);
  });
  return nav;
}

// =============== HEADER ================
// buildHeader: Crea el encabezado con el logo "SERENITY" y el panel de estadísticas rápidas.
function buildHeader() {
  const header = el('header',{
    styles:{paddingTop:'52px',paddingBottom:'18px',display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:'24px'}
  });
  const brand = el('div');
  brand.appendChild(el('p',{text:'— SERENITY —',styles:{
    fontFamily: DS.fontBody, fontSize:'.7rem',fontWeight:'600',letterSpacing:'.34em',color:DS.gold,marginBottom:'4px'}}));
  const h1 = el('h1',{styles:{fontFamily:DS.fontHead,fontSize:'clamp(2.4rem,5vw,3.8rem)',fontWeight:'300',letterSpacing:'-.01em',lineHeight:'1.05',color:DS.text}});
  h1.innerHTML = 'Spa &amp; Hotel<br><em style="color:'+DS.gold+';font-style:italic">Reservas</em>'; brand.appendChild(h1);

  // Stats rápidas
  const stats = el('div',{styles:{display:'flex',gap:'32px',flexWrap:'wrap',alignItems:'flex-end'}});
  stats.appendChild(buildStat('res','Reservados','0'));
  stats.appendChild(buildStat('fav','Favoritos','0'));
  stats.appendChild(buildStat('lib','Libres','0'));
  header.appendChild(brand);header.appendChild(stats);return header;
}

function buildStat(id,label,valor){
  const wrap = el('div',{styles:{textAlign:'right'}});
  wrap.appendChild(el('div',{text:valor,attrs:{id:`stat-${id}`},styles:{fontFamily:DS.fontHead,fontSize:'2.0rem',fontWeight:'300',color:DS.gold,lineHeight:'1'}}));
  wrap.appendChild(el('div',{text:label,styles:{fontFamily:DS.fontBody,fontSize:'.7rem',fontWeight:'500',letterSpacing:'.12em',textTransform:'uppercase',color:DS.textLight,marginTop:'4px'}}));
  return wrap;
}

// =============== FORMULARIO PANEL IZQ ================
// buildFormPanel: Construye el panel lateral que cambia entre mensaje de ayuda, formulario de creación o detalles de eliminación.
function buildFormPanel(){
  const panel = el('section',{styles:{
    background: DS.surface, border:`1px solid ${DS.border}`,
    borderTop: `3px solid ${DS.gold}`,padding:'30px 28px',position:'sticky',top:'24px',
    boxShadow: DS.shadow,borderRadius: DS.radiusMd,minWidth:'0', transition: 'all 0.3s', zIndex: 10}
  });

  if (!state.isBookingActive) {
    panel.appendChild(el('h2',{text:'Reserva',styles:{fontFamily:DS.fontHead,fontSize:'1.3rem',fontWeight:'400',color:DS.text,marginBottom:'12px'}}));
    const hint = el('p', {
      text: state.vista === 'hotel' ? '📅 Selecciona un día en el calendario para gestionar la reserva.' : '✨ Selecciona un servicio de la lista para ver detalles o reservar.',
      styles: {fontFamily: DS.fontBody, color: DS.textLight, fontSize: '0.95rem', fontStyle: 'italic', lineHeight: '1.5'}
    });
    panel.appendChild(hint);
    return panel;
  }

  const isViewing = state.isViewingExisting;
  const title = state.form.servicio || 'Estancia Hotel';
  
  panel.appendChild(el('h2',{ // Título dinámico según si estamos viendo o creando
    html: isViewing ? 'Detalles <em style="color:'+DS.gold+'">Reserva</em>' : 'Nueva <em style="color:'+DS.gold+'">Reserva</em>',
    styles:{fontFamily:DS.fontHead,fontSize:'1.3rem',fontWeight:'400',color:DS.text,marginBottom:'2px'}
  }));
  panel.appendChild(el('p',{text: title, styles:{fontFamily:DS.fontBody, fontSize:'.8rem', color:DS.gold, fontWeight:'700', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'20px'}}));

  // Campos: Solo mostramos el nombre si es una nueva reserva
  if (!isViewing) {
    const huespedCampo = buildCampo('huesped', 'Nombre del huésped', 'text', 'Ej: María García');
    panel.appendChild(huespedCampo);
  }

  // La fecha solo se solicita/muestra para el Hotel
  if (state.form.tipoReserva === 'hotel') {
    const fechaCampo = buildCampo('fecha', 'Fecha de la reserva', 'date', '');
    if (isViewing) fechaCampo.querySelector('input').disabled = true;
    panel.appendChild(fechaCampo);
  }

  const btnRow = el('div', {styles: {display:'flex', gap:'10px', marginTop:'8px'}});
  const btnCancel = el('button', {
    text: 'Volver',
    styles: {
      flex: 1, padding: '12px', background: 'transparent', color: DS.textLight,
      fontFamily: DS.fontBody, borderRadius: '5px', border: `1px solid ${DS.border}`,
      cursor: 'pointer', fontSize: '.98rem'
    }
  });
  btnCancel.onclick = () => { state.isBookingActive = false; state.isViewingExisting = false; buildUI(); };

  const btnAction = el('button',{
    text: isViewing ? 'Eliminar' : 'Confirmar',
    styles:{
      flex: 1, padding:'12px',
      background: isViewing ? DS.danger : DS.bgDark,
      color: isViewing ? '#fff' : DS.goldLight,
      fontFamily: DS.fontBody, borderRadius:'5px',border:'none',
      fontWeight:'bold',cursor:'pointer',fontSize:'.98rem',letterSpacing:'.12em'
    }
  });
  
  btnAction.onclick = isViewing ? eliminarReservaActiva : agregarReserva;

  btnRow.appendChild(btnCancel);
  btnRow.appendChild(btnAction);
  panel.appendChild(btnRow);
  return panel;
}

// buildCampo: Generador de grupos de input (Label + Input) con estilos predefinidos.
function buildCampo(nombre,etiqueta,tipo,placeholder){
  const grupo=el('div',{styles:{marginBottom:'16px'}});
  grupo.appendChild(el('label',{text:etiqueta,styles:{fontFamily:DS.fontBody,fontSize:'.78rem',color:DS.textLight,marginBottom:'6px',display:'block'}}));
  const input=el('input',{attrs:{type:tipo,id:`campo-${nombre}`,placeholder:placeholder||''},styles:{fontFamily:DS.fontBody,width:'100%',padding:'8px',border:`1px solid ${DS.border}`,borderRadius:'4px'}});
  input.value=state.form[nombre];input.oninput=()=>{state.form[nombre]=input.value;};
  grupo.appendChild(input);return grupo;
}

function limpiarFormulario() {
  state.form = { huesped: '', fecha: '', tipoReserva: state.vista, servicio: '' };
  buildUI();
}

function eliminarReservaActiva() {
  const { fecha, tipoReserva, servicio } = state.form;
  
  if(tipoReserva === 'hotel') state.reservasHotel = state.reservasHotel.filter(r => r.fecha !== fecha);
  if(tipoReserva === 'spa') state.reservasSpa = state.reservasSpa.filter(r => !(r.titulo === servicio && r.fecha === fecha));
  if(tipoReserva === 'masajes') state.reservasMasajes = state.reservasMasajes.filter(r => !(r.titulo === servicio && r.fecha === fecha));

  state.isBookingActive = false;
  state.isViewingExisting = false;
  guardarLocal(); renderVista(); buildUI(); toast('Reserva eliminada', 'info');
}

// guardarLocal: Persistencia de datos en el navegador usando localStorage.
function guardarLocal() {
  localStorage.setItem('serenity_state', JSON.stringify({
    reservasHotel: state.reservasHotel,
    reservasSpa: state.reservasSpa,
    reservasMasajes: state.reservasMasajes,
    nextIdSpa: state.nextIdSpa,
    nextIdMasajes: state.nextIdMasajes,
    favoritos: state.favoritos
  }));
}

// agregarReserva: Valida y procesa la creación de una reserva según la sección (Hotel, Spa o Masajes).
function agregarReserva(){
  let {huesped,fecha,tipoReserva,servicio}=state.form;
  if(!huesped||huesped.trim().length<3){toast('El nombre debe tener al menos 3 letras','warn');return;}
  
  // Si es Spa o Masaje y no hay fecha (porque se ocultó el campo), usamos hoy por defecto
  if (tipoReserva !== 'hotel' && !fecha) fecha = d(0);
  
  if(!fecha){toast('Selecciona la fecha','warn');return;}
  
  if(tipoReserva==='hotel'){
    if(state.reservasHotel.some(r=>r.fecha===fecha)){toast('Día ocupado','warn');return;}
    state.reservasHotel.push({fecha,huesped});
  } else if(tipoReserva==='spa'){
    if(!servicio){toast('Elige un tratamiento','warn');return;}
    if(state.reservasSpa.some(r=>r.titulo===servicio && r.fecha===fecha)){toast('Tratamiento ocupado ese día','warn');return;}
    let desc=SPA_TRATAMIENTOS.find(x=>x.label===servicio)?.descripcion||'';
    state.reservasSpa.push({id:state.nextIdSpa++,titulo:servicio,descripcion:desc,fecha,favorito:false,huesped});
  } else if(tipoReserva==='masajes'){
    if(!servicio){toast('Elige un masaje','warn');return;}
    if(state.reservasMasajes.some(r=>r.titulo===servicio && r.fecha===fecha)){toast('Masaje ocupado ese día','warn');return;}
    let desc=MASAJES_LISTA.find(x=>x.label===servicio)?.descripcion||'';
    state.reservasMasajes.push({id:state.nextIdMasajes++,titulo:servicio,descripcion:desc,fecha,favorito:false,huesped});
  }
  state.isBookingActive = false;
  state.vista = tipoReserva;
  guardarLocal(); limpiarFormulario(); toast('Reserva registrada','ok');
}

// ========== PANEL PRINCIPAL =============
// renderVista: Gestiona el renderizado del panel derecho según la sección activa y maneja el buscador.
function renderVista(){
  const panel = $('#main-panel');
  if (!panel) return;

  // 1. Crear estructura persistente si no existe para evitar pérdida de foco al escribir
  if (!$('#search-container')) {
    panel.innerHTML = '';
    panel.appendChild(el('div', {attrs: {id: 'search-container'}}));
    panel.appendChild(el('div', {attrs: {id: 'vista-results'}}));
  }
  
  const searchBox = $('#search-container');
  const resultsBox = $('#vista-results');

  // 2. Gestionar el Buscador: Solo se crea si no existe o si cambiamos de pestaña
  if (state.vista === 'hotel') {
    searchBox.innerHTML = '';
  } else if (!searchBox.querySelector('input')) {
    const buscWrap = el('div',{styles:{display:'flex',gap:'16px',margin:'0 0 23px 0',justifyContent:'flex-end',alignItems:'center',padding:'25px 0 0'}});
    buscWrap.appendChild(el('label',{text:'Buscar:',styles:{fontFamily:DS.fontBody,marginRight:'8px',color:DS.textLight,fontSize:'.97rem'}}));
    
    const buscador=el('input',{attrs:{type:'text', placeholder:'Busca un servicio...'},styles:{background:DS.card,border:`1.3px solid ${DS.border}`,fontFamily:DS.fontBody,fontSize:'1.01rem',padding:'8px 13px',borderRadius:'5px',outline:'none',minWidth:'170px'}});
    
    // Implementación de Debounce: Espera 300ms antes de ejecutar la búsqueda
    buscador.oninput=()=>{
      clearTimeout(state.searchTimer);
      state.searchTimer = setTimeout(() => {
        state.buscadorNombre = buscador.value.toLowerCase().trim();
        renderVista(); 
      }, 300);
    };
    
    buscWrap.appendChild(buscador);
    searchBox.appendChild(buscWrap);
  }

  // 3. Renderizar Contenido Dinámico (Resultados)
  resultsBox.innerHTML = '';
  const inner = el('div',{styles:{padding:'0 24px 40px',marginTop:'-18px'}});
  if(state.vista==='hotel') inner.appendChild(buildHotelPanel());
  if(state.vista==='spa')   inner.appendChild(buildReservasPanel('spa'));
  if(state.vista==='masajes') inner.appendChild(buildReservasPanel('masajes'));
  resultsBox.appendChild(inner);
  
  actualizarEstadisticas();
}

// filtrar: Función de búsqueda simple para filtrar arrays de reservas.
function filtrar(arr){if(!state.buscadorNombre)return arr;return arr.filter(r=> (r.huesped&&r.huesped.toLowerCase().includes(state.buscadorNombre)) || (r.titulo&&r.titulo.toLowerCase().includes(state.buscadorNombre)));}

// buildHotelPanel: Lógica de construcción del calendario mensual, calculando días, huecos y reservas.
function buildHotelPanel(){
  const wrap = el('div',{});
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  // Navegación de mes
  const header = el('div', {styles: {display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}});
  const prev = el('button', {text: '❮', styles: {background:'none', border:'none', color:DS.gold, cursor:'pointer', fontSize:'1.1rem', padding:'5px 10px'}});
  const next = el('button', {text: '❯', styles: {background:'none', border:'none', color:DS.gold, cursor:'pointer', fontSize:'1.1rem', padding:'5px 10px'}});
  const title = el('h2', {html: `${meses[state.calendarMonth]} <em style="color:${DS.gold}">${state.calendarYear}</em>`, styles: {fontFamily:DS.fontHead, fontSize:'1.4rem', margin:0, fontWeight:'400'}});

  prev.onclick = () => { state.calendarMonth--; if(state.calendarMonth < 0){ state.calendarMonth = 11; state.calendarYear--; } renderVista(); };
  next.onclick = () => { state.calendarMonth++; if(state.calendarMonth > 11){ state.calendarMonth = 0; state.calendarYear++; } renderVista(); };

  header.appendChild(prev); header.appendChild(title); header.appendChild(next);
  wrap.appendChild(header);

  // calendario mes
  const ano=state.calendarYear, mes=state.calendarMonth, reservas=filtrar(state.reservasHotel), diasMes=new Date(ano,mes+1,0).getDate(), primerDia=new Date(ano,mes,1).getDay();
  const grid=el('div',{styles:{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'8px',background:DS.card,padding:'16px',borderRadius:DS.radiusMd}});
  ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].forEach(d=>grid.appendChild(el('div',{text:d,styles:{fontWeight:'600',color:DS.gold,padding:'2px',fontFamily:DS.fontBody}})));
  for(let i=0;i<(primerDia+6)%7;i++)grid.appendChild(el('div'));
  for(let di=1;di<=diasMes;di++){
    let fecha = `${ano}-${String(mes+1).padStart(2,'0')}-${String(di).padStart(2,'0')}`;
    const r = reservas.find(x=>x.fecha===fecha);
    const cell = el('div',{styles:{
      minHeight:'47px',background:r?DS.goldLight:DS.surface,
      border:r?`2px solid ${DS.gold}`:`1px solid ${DS.border}`,borderRadius:DS.radiusMd,
      textAlign:'center',fontFamily:DS.fontBody,fontWeight:'500',color:r?DS.gold:DS.textMid,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontSize:'1.12rem',cursor:'pointer'
    }});
    cell.textContent=di;
    if(r){
      cell.appendChild(el('div',{text:'RESERVADO',styles:{fontSize:'0.65rem',fontWeight:'700',color:DS.gold,marginTop:'5px',letterSpacing:'0.05em'}}));
      cell.onclick=()=>{
        state.form = { huesped: 'RESERVADO', fecha: r.fecha, tipoReserva: 'hotel', servicio: '' };
        state.isBookingActive = true;
        state.isViewingExisting = true;
        buildUI();
      };
    }
    else{
      cell.style.opacity='0.82';
      cell.onclick=()=>{
        state.form.fecha = fecha;
        state.form.huesped = '';
        state.isBookingActive = true;
        state.isViewingExisting = false;
        buildUI();
      };
    }
    grid.appendChild(cell);
  }
  wrap.appendChild(grid); return wrap;
}

// buildReservasPanel: Crea la cuadrícula de tarjetas para Spa y Masajes con lógica de estilos para Favoritos y Reservados.
function buildReservasPanel(tipo){
  let lista = tipo==='spa'?SPA_TRATAMIENTOS:MASAJES_LISTA;
  // Filtramos el catálogo de servicios por nombre
  if(state.buscadorNombre) {
    lista = lista.filter(s => s.label.toLowerCase().includes(state.buscadorNombre));
  }
  
  const reservas = tipo==='spa'?state.reservasSpa:state.reservasMasajes;
  const wrap = el('div',{});
  wrap.appendChild(el('h2',{text:(tipo==='spa'?'Tratamientos Spa':'Masajes & Relajación'),styles:{fontFamily:DS.fontHead,fontSize:'1.1rem',color:DS.text,marginBottom:'11px'}}));
  const grid=el('div',{styles:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(248px,1fr))',gap:'19px',marginTop:'14px'}});
  lista.forEach(serv=>{
    const res = reservas.find(r=>r.titulo===serv.label);
    const isFav = state.favoritos.includes(serv.label);
    const isBoth = res && isFav;

    const colorBase = tipo === 'spa' ? DS.sage : DS.terra;
    const colorPale = tipo === 'spa' ? DS.sagePale : DS.terraPale;

    const card = el('div',{styles:{
      background: isBoth ? `linear-gradient(135deg, ${colorPale} 25%, ${DS.goldPale} 100%)` : (res ? colorPale : (isFav ? DS.goldPale : DS.card)),
      border: isBoth ? `3px solid ${DS.gold}` : (res ? `2px solid ${colorBase}` : (isFav ? `2px solid ${DS.gold}` : `1.4px solid ${DS.border}`)),
      borderTop: `4px solid ${res ? colorBase : DS.gold}`,
      boxShadow: isBoth ? `0 0 0 2px ${colorPale}, 0 12px 48px -12px ${colorBase}66` : (isFav || res ? DS.shadowLg : DS.shadow),
      outline: isBoth ? `1.5px solid ${colorBase}44` : 'none', // Outline for combined state
      outlineOffset: isBoth ? '2px' : '0', // Offset for outline
      borderRadius:DS.radiusMd,padding:'23px 16px',position:'relative',minHeight:'108px',transition:'all .15s', // minHeight ensures cards don't collapse
      display: 'flex', flexDirection: 'column', // Make card a flex container
      cursor: 'pointer'
    }});
    
    card.onclick = () => {
      state.form = { 
        huesped: res ? 'RESERVADO' : '', 
        fecha: res ? res.fecha : '', 
        tipoReserva: tipo, 
        servicio: serv.label 
      };
      state.isBookingActive = true;
      state.isViewingExisting = !!res;
      buildUI();
    };

    // Botón de Favorito (Siempre visible)
    const favBtn = el('span',{
      text:'⭐',
      styles:{position:'absolute',top:'12px',right:'15px',fontSize:'1.3rem',color:isFav?DS.gold:DS.goldLight,opacity:isFav?'1':'0.3',cursor:'pointer',zIndex:5}
    });
    favBtn.onclick=(e)=>{
      e.stopPropagation();
      if(state.favoritos.includes(serv.label)) state.favoritos = state.favoritos.filter(l => l !== serv.label);
      else state.favoritos.push(serv.label);
      guardarLocal();
      renderVista();
    };
    card.appendChild(favBtn);

    card.appendChild(el('h3',{text:serv.label,styles:{fontFamily:DS.fontHead,fontSize:'1.07rem',color:DS.text,marginBottom:'6px'}}));
    card.appendChild(el('p',{text:serv.descripcion,styles:{fontFamily:DS.fontBody,color:DS.textLight,fontWeight:'400',fontSize:'.94rem',marginBottom:'7px'}}));
    
    if(res){
      card.appendChild(el('div',{text:'RESERVADO',styles:{fontFamily:DS.fontBody,color:colorBase,fontWeight:'700',fontSize:'.85rem',marginTop:'auto',letterSpacing:'.1em'}}));
    } else {
      const bookBtn = el('button', {
        text: 'Reservar',
        styles: {
          width: '100%', padding: '10px', background: 'transparent', color: DS.gold,
          border: `1px solid ${DS.gold}`, borderRadius: '5px', cursor: 'pointer', // Border for the button
          fontFamily: DS.fontBody, fontWeight: '600', marginTop: 'auto', transition: 'all .2s' // Push to bottom
        }
      });
      bookBtn.onclick = () => {
        state.form.servicio = serv.label;
        state.form.tipoReserva = tipo;
        state.isBookingActive = true;
        buildUI();
      };
      card.appendChild(bookBtn);
    }
    grid.appendChild(card);
  });
  wrap.appendChild(grid);return wrap;
}

// ============== ESTADÍSTICAS ================
// actualizarEstadisticas: Calcula los números que aparecen en el Header basándose en el estado actual y los filtros.
function actualizarEstadisticas(){
  let res=0,fav=0,lib=0;
  if(state.vista==='hotel'){
    const mes=state.calendarMonth, ano=state.calendarYear, diasMes=new Date(ano,mes+1,0).getDate();
    const reservadosMes = state.reservasHotel.filter(r=>(new Date(r.fecha)).getMonth()===mes&&new Date(r.fecha).getFullYear()===ano).length;
    res=reservadosMes;
    lib=diasMes - reservadosMes;
  }else if(state.vista==='spa'){
    const reservadosUnicos = new Set(state.reservasSpa.map(r => r.titulo)).size;
    res=reservadosUnicos;
    fav=state.favoritos.filter(label => SPA_TRATAMIENTOS.some(t => t.label === label)).length;
    lib=SPA_TRATAMIENTOS.length - reservadosUnicos;
  }else{
    const reservadosUnicos = new Set(state.reservasMasajes.map(r => r.titulo)).size;
    res=reservadosUnicos;
    fav=state.favoritos.filter(label => MASAJES_LISTA.some(m => m.label === label)).length;
    lib=MASAJES_LISTA.length - reservadosUnicos;
  }
  
  const eRes = $('#stat-res'); if(eRes) eRes.textContent = res;
  const eFav = $('#stat-fav'); 
  if(eFav) {
    eFav.textContent = fav;
    // Ocultamos el elemento padre (el wrap de la estadística) si estamos en la vista hotel
    eFav.parentElement.style.display = state.vista === 'hotel' ? 'none' : 'block';
  }
  const eLib = $('#stat-lib'); if(eLib) eLib.textContent = lib;
}

// ============== TOAST ================
// toast: Sistema de notificaciones temporales para avisar al usuario del éxito o error de sus acciones.
function toast(msg,tipo='ok'){const C={ok:{c:DS.sage},warn:{c:DS.terra},info:{c:DS.gold}};const tc=$('#toast-container')||(function(){let x=el('div',{attrs:{id:'toast-container'}});document.body.appendChild(x);return x;})();tc.style.position='fixed';tc.style.bottom='32px';tc.style.right='32px';tc.style.zIndex='900';const dv=el('div',{styles:{background:DS.surface,border:`1px solid ${DS.border}`,borderLeft:`4px solid ${C[tipo].c}`,padding:'12px 16px',fontFamily:DS.fontBody,fontSize:'.99rem',color:DS.textMid,boxShadow:DS.shadowLg,borderRadius:'4px',margin:'2px 0',animation:'toastIn .24s both'}});dv.textContent=msg;tc.appendChild(dv);setTimeout(()=>{dv.style.opacity='0';dv.style.transform='translateX(30px)';setTimeout(()=>dv.remove(),330)},1800);}
// Inyecta el CSS necesario para la animación de las notificaciones.
function insertarKeyframes(){if($('#serenity-keys'))return;const s=document.createElement('style');s.id='serenity-keys';s.textContent=`@keyframes toastIn{from{opacity:0;transform:translateX(16px);}to{opacity:1;transform:none;}}`;document.head.appendChild(s);}

// ============== DEMO DATA ================
// cargarDemo: Inicializa la aplicación con datos de prueba o recupera los datos guardados en el navegador.
function cargarDemo(){
  const stored = localStorage.getItem('serenity_state');
  if (stored) {
    const parsed = JSON.parse(stored);
    Object.assign(state, parsed);
    return;
  }
  state.reservasHotel.push({ fecha: d(1), huesped: 'Elena Martínez' });
  state.reservasHotel.push({ fecha: d(3), huesped: 'Carlos Ruiz' });
  state.reservasSpa.push({ id:state.nextIdSpa++,titulo:'Masaje relajante',descripcion:'',fecha:d(2),huesped:"Ana López" });
  state.reservasSpa.push({ id:state.nextIdSpa++,titulo:'Facial revitalizante',descripcion:'',fecha:d(5),huesped:"Carolina Sueiro" });
  state.reservasMasajes.push({ id:state.nextIdMasajes++,titulo:'Masaje sueco',descripcion:'',fecha:d(2),huesped:"Jordi Pérez" });
  state.reservasMasajes.push({ id:state.nextIdMasajes++,titulo:'Masaje tailandés',descripcion:'',fecha:d(6),huesped:"Irene Ponce" });
  
  state.favoritos.push('Masaje relajante', 'Masaje tailandés');
}

buildUI(); cargarDemo(); renderVista();