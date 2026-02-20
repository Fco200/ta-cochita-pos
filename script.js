// Cargar productos base o del localStorage
const productosBase = [
    { id: 1, nombre: "Taco Variado", precio: 35, icono: "🌮" },
    { id: 2, nombre: "Torta Diversa", precio: 80, icono: "🥪" },
    { id: 3, nombre: "Quesadilla Emb.", precio: 65, icono: "🧀" },
    { id: 4, nombre: "Carnitas 1/4 + Soda", precio: 125, icono: "🥤" },
    { id: 5, nombre: "1/4 Carnitas Orden", precio: 110, icono: "🐷" },
    { id: 6, nombre: "1/2 Carnitas Orden", precio: 220, icono: "🐷" },
    { id: 7, nombre: "3/4 Carnitas Orden", precio: 330, icono: "🐷" },
    { id: 8, nombre: "Orden Completa", precio: 390, icono: "🐷" },
];

let productos = JSON.parse(localStorage.getItem('menuCochita')) || productosBase;
let carrito = [];
let ventasDia = JSON.parse(localStorage.getItem('ventasCochita')) || [];
let pedidosPendientes = JSON.parse(localStorage.getItem('pendientesCochita')) || [];
let usuarioActivo = "";
let ventaTemporal = null; // Guardará la venta antes de confirmarla
// Inicializar contraseñas desde localStorage o usar las base
let credenciales = JSON.parse(localStorage.getItem('passCochita')) || {
    "Aurelia": "1234",
    "Cajera 2": "5678",
    "Admin": "0000"
};

// --- LOGIN Y PRODUCTOS ---
function login() {
    const user = document.getElementById('user-select').value;
    const pass = document.getElementById('user-pass').value;

    // IMPORTANTE: Cambiar usuarios[user] por credenciales[user]
    if (credenciales[user] === pass) {
        usuarioActivo = user;
        document.getElementById('login-screen').classList.add('d-none');
        document.getElementById('main-app').style.display = 'block';
        document.getElementById('current-user-name').innerText = user;
        renderProductos();
        renderPendientes();
    } else {
        alert("Contraseña incorrecta");
    }
}



function renderProductos() {
    const contenedor = document.getElementById('contenedor-productos');
    contenedor.innerHTML = productos.map(p => `
        <div class="col-6 col-md-3">
            <div class="card h-100 card-producto shadow-sm" onclick="agregarAlCarrito(${p.id})">
                <div class="card-body text-center p-2">
                    <div style="font-size: 1.5rem;">${p.icono}</div>
                    <div class="fw-bold small">${p.nombre}</div>
                    <div class="text-danger fw-bold">$${p.precio}</div>
                </div>
            </div>
        </div>
    `).join('');
}

function agregarAlCarrito(id) {
    const prod = productos.find(p => p.id === id);
    const existe = carrito.find(item => item.id === id);
    if(existe) existe.cant++; else carrito.push({...prod, cant: 1});
    actualizarTabla();
}

function eliminar(i) { carrito.splice(i, 1); actualizarTabla(); }

function actualizarTabla() {
    const tbody = document.getElementById('lista-carrito');
    let total = 0;
    tbody.innerHTML = carrito.map((item, i) => {
        total += item.precio * item.cant;
        return `<tr><td class="ps-2 small"><strong>${item.cant}</strong> ${item.nombre}</td>
                <td class="text-end pe-2">$${item.precio * item.cant}</td>
                <td><button class="btn btn-sm text-danger" onclick="eliminar(${i})">✕</button></td></tr>`;
    }).join('');
    document.getElementById('total-venta').innerText = total;
    calcularCambioReal();
}

// --- NUEVOS PRODUCTOS ---
function toggleNuevoProducto() {
    const m = document.getElementById('modal-nuevo-producto');
    m.style.display = m.style.display === 'none' ? 'flex' : 'none';
}

function guardarNuevoProducto() {
    const nombre = document.getElementById('np-nombre').value;
    const precio = parseFloat(document.getElementById('np-precio').value);
    const icono = document.getElementById('np-icono').value || "🍽️";

    if(!nombre || !precio) return alert("Llena los datos");

    const nuevo = { id: Date.now(), nombre, precio, icono };
    productos.push(nuevo);
    localStorage.setItem('menuCochita', JSON.stringify(productos));
    renderProductos();
    toggleNuevoProducto();
}

// --- COBRO Y TICKET ---
function mostrarConfirmacionCobro() {
    if(carrito.length === 0) return;
    const total = parseFloat(document.getElementById('total-venta').innerText);
    const efectivo = parseFloat(document.getElementById('efectivo').value) || 0;
    const metodo = document.getElementById('metodo-pago').value;
    const origen = document.querySelector('input[name="orderType"]:checked').value;

    if(metodo === "Efectivo" && efectivo < total) return alert("Efectivo insuficiente");

    ventaTemporal = {
        id: Date.now(),
        cajera: usuarioActivo,
        origen, metodo, items: [...carrito],
        total, efectivo, cambio: efectivo - total,
        fecha: new Date().toLocaleTimeString(),
        dia: new Date().toLocaleDateString()
    };

    // Llenar Modal Ticket
    document.getElementById('t-origen').innerText = `PEDIDO ${origen.toUpperCase()}`;
    document.getElementById('t-items').innerHTML = carrito.map(i => `<div>${i.cant}x ${i.nombre} - $${i.precio*i.cant}</div>`).join('');
    document.getElementById('t-total').innerText = `TOTAL: $${total}`;
    document.getElementById('t-pago').innerText = `Pago: ${metodo} $${metivo = metodo==="Efectivo"?efectivo:total}`;
    document.getElementById('t-cambio').innerText = metodo === "Efectivo" ? `Cambio: $${(efectivo-total).toFixed(2)}` : "";

    document.getElementById('modal-ticket').style.display = "flex";
}

function confirmarYGuardar() {
    ventasDia.push(ventaTemporal);
    localStorage.setItem('ventasCochita', JSON.stringify(ventasDia));
    
    // Resetear todo
    carrito = [];
    ventaTemporal = null;
    document.getElementById('efectivo').value = "";
    document.getElementById('notas-pedido').value = "";
    actualizarTabla();
    cerrarTicket();
    alert("Venta guardada con éxito.");
}

function cerrarTicket() { document.getElementById('modal-ticket').style.display = "none"; }

// --- PEDIDOS PENDIENTES ---
function crearPedidoPendiente() {
    if (carrito.length === 0) return;
    const origen = document.querySelector('input[name="orderType"]:checked').value;
    const notas = document.getElementById('notas-pedido').value || "S/N";

    pedidosPendientes.push({
        id: Date.now(), cliente: notas, items: [...carrito],
        total: parseFloat(document.getElementById('total-venta').innerText),
        origen, status: "Pendiente",
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    localStorage.setItem('pendientesCochita', JSON.stringify(pedidosPendientes));
    carrito = [];
    document.getElementById('notas-pedido').value = '';
    actualizarTabla();
    renderPendientes();
}

function renderPendientes() {
    const contenedor = document.getElementById('contenedor-pedidos-pendientes');
    contenedor.innerHTML = pedidosPendientes.map(p => `
        <div class="col-md-4 mb-2">
            <div class="card shadow-sm pedido-${p.origen.replace('/','-')}">
                <div class="card-body p-2">
                    <div class="d-flex justify-content-between small fw-bold">
                        <span>${p.origen}</span> <span>${p.hora}</span>
                    </div>
                    <div class="fw-bold">${p.cliente}</div>
                    <div class="text-danger fw-bold text-end">$${p.total}</div>
                    <div class="d-flex gap-1 mt-2">
                        <button class="btn btn-xs btn-success w-100" onclick="cobrarPendiente(${p.id})">Cobrar</button>
                        <button class="btn btn-xs btn-danger" onclick="eliminarPendiente(${p.id})">✕</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function cobrarPendiente(id) {
    const p = pedidosPendientes.find(p => p.id === id);
    carrito = [...p.items];
    document.getElementById('notas-pedido').value = p.cliente;
    eliminarPendiente(id);
    actualizarTabla();
}

function eliminarPendiente(id) {
    pedidosPendientes = pedidosPendientes.filter(p => p.id !== id);
    localStorage.setItem('pendientesCochita', JSON.stringify(pedidosPendientes));
    renderPendientes();
}

// --- OTROS ---
function calcularCambioReal() {
    const t = parseFloat(document.getElementById('total-venta').innerText);
    const e = parseFloat(document.getElementById('efectivo').value) || 0;
    document.getElementById('cambio-venta').innerText = (e >= t ? e - t : 0).toFixed(2);
}

function toggleHistorial() {
    const m = document.getElementById('modal-historial');
    m.style.display = m.style.display === 'none' ? 'flex' : 'none';
    if(m.style.display === 'flex') {
        let l=0, t=0, a=0;
        const body = document.getElementById('lista-historial');
        body.innerHTML = ventasDia.map(v => {
            if(v.origen === "Local") l += v.total;
            if(v.origen === "Teléfono") t += v.total;
            if(v.origen === "App/Didi") a += v.total;
            return `<tr><td>${v.fecha}</td><td>${v.origen}</td><td>${v.metodo}</td><td>$${v.total}</td></tr>`;
        }).join('');
        document.getElementById('stats-container').innerHTML = `
            <div class="col-4"><div class="card bg-primary text-white p-1">🏠$${l}</div></div>
            <div class="col-4"><div class="card bg-success text-white p-1">📞$${t}</div></div>
            <div class="col-4"><div class="card bg-warning p-1">📱$${a}</div></div>
            <div class="col-12 mt-2"><h5>Total: $${l+t+a}</h5></div>`;
    }
}

function logout() { location.reload(); }
function imprimirPDF() { /* Aquí va tu lógica de jsPDF anterior usando ventaTemporal */ alert("Ticket PDF Generado"); }
function actualizarInterfazPago() {
    document.getElementById('seccion-pago-efectivo').style.display = 
        document.getElementById('metodo-pago').value === "Efectivo" ? "block" : "none";
}
// --- FUNCIÓN DE CORTE CON DESCARGA DE PDF ---
function limpiarCorte() {
    if (ventasDia.length === 0) {
        alert("No hay ventas registradas para realizar el corte.");
        return;
    }

    // Preguntar si desea descargar el reporte antes de borrar
    if (confirm("¿Deseas realizar el corte de caja?")) {
        
        const deseaDescargar = confirm("¿Deseas descargar el reporte de ventas en PDF antes de limpiar el historial?");
        
        if (deseaDescargar) {
            generarReporteCortePDF();
        }

        // Borrar datos después de la descarga (o si no quiso descargar)
        ventasDia = [];
        localStorage.removeItem('ventasCochita');
        toggleHistorial();
        alert("Corte de caja realizado con éxito. El historial ha sido limpiado.");
    }
}

// --- GENERAR PDF DEL CORTE DE CAJA ---
function generarReporteCortePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const fechaHoy = new Date().toLocaleDateString();
    const horaCorte = new Date().toLocaleTimeString();

    // Título y Encabezado
    doc.setFontSize(18);
    doc.text("REPORTE DE CORTE DE CAJA - TA' COCHITA", 105, 15, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`Fecha: ${fechaHoy}`, 20, 25);
    doc.text(`Hora del Corte: ${horaCorte}`, 20, 30);
    doc.text(`Generado por: ${usuarioActivo}`, 20, 35);
    doc.text("---------------------------------------------------------------------------------------------------------", 20, 40);

    // Cálculos de Totales
    let totalLocal = 0, totalTel = 0, totalApp = 0;
    ventasDia.forEach(v => {
        if(v.origen === "Local") totalLocal += v.total;
        if(v.origen === "Teléfono") totalTel += v.total;
        if(v.origen === "App/Didi") totalApp += v.total;
    });

    // Resumen Financiero
    doc.setFontSize(12);
    doc.text("RESUMEN DE VENTAS", 20, 50);
    doc.text(`Ventas Local: $${totalLocal.toFixed(2)}`, 30, 60);
    doc.text(`Ventas Teléfono: $${totalTel.toFixed(2)}`, 30, 67);
    doc.text(`Ventas App/Didi: $${totalApp.toFixed(2)}`, 30, 74);
    
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL GENERAL: $${(totalLocal + totalTel + totalApp).toFixed(2)}`, 30, 85);
    doc.setFont(undefined, 'normal');

    // Tabla de Detalle
    doc.text("DETALLE DE TRANSACCIONES", 20, 100);
    doc.setFontSize(9);
    let y = 110;
    
    // Encabezados de tabla
    doc.text("Hora", 20, y);
    doc.text("Origen", 50, y);
    doc.text("Método", 90, y);
    doc.text("Total", 140, y);
    y += 5;
    doc.text("---------------------------------------------------------------------------------------------------------------------------------", 20, y);
    y += 7;

    ventasDia.forEach((v) => {
        if (y > 270) { // Si llega al final de la hoja, crea una nueva
            doc.addPage();
            y = 20;
        }
        doc.text(v.fecha, 20, y);
        doc.text(v.origen, 50, y);
        doc.text(v.metodo, 90, y);
        doc.text(`$${v.total.toFixed(2)}`, 140, y);
        y += 6;
    });

    // Guardar el archivo
    doc.save(`Corte_Caja_${fechaHoy.replace(/\//g, '-')}.pdf`);
}
// 3. Asegúrate de tener estas funciones al final del script
function toggleCambiarPass() {
    const m = document.getElementById('modal-cambiar-pass');
    document.getElementById('pass-user-target').innerText = usuarioActivo;
    m.style.display = m.style.display === 'none' ? 'flex' : 'none';
}

function guardarNuevaPass() {
    const nuevaPass = document.getElementById('nueva-pass-input').value.trim();
    if (nuevaPass.length < 1) return alert("Escribe una contraseña válida");

    credenciales[usuarioActivo] = nuevaPass; // Cambia la clave en memoria
    localStorage.setItem('passCochita', JSON.stringify(credenciales)); // La guarda para siempre
    
    alert("Contraseña cambiada. Se usará la próxima vez que inicies sesión.");
    toggleCambiarPass();
}
// --- DATOS DE PROMOCIONES ---
let promociones = JSON.parse(localStorage.getItem('promosCochita')) || [];

function renderPromociones() {
    const contenedor = document.getElementById('contenedor-promociones');
    if (promociones.length === 0) {
        contenedor.innerHTML = `<p class="text-center text-muted small">No hay promociones configuradas para hoy.</p>`;
        return;
    }

    contenedor.innerHTML = promociones.map(p => `
        <div class="col-6 col-md-4 col-lg-3">
            <div class="card h-100 card-promo shadow-sm position-relative" onclick="agregarPromoAlCarrito(${p.id})">
                <span class="promo-badge">PROMO</span>
                <div class="card-body text-center p-2">
                    <div style="font-size: 1.5rem;">${p.icono}</div>
                    <div class="fw-bold text-dark small" style="line-height: 1.1;">${p.nombre}</div>
                    <div class="text-danger fw-bold">$${p.precio}</div>
                </div>
            </div>
        </div>
    `).join('');
}

function agregarPromoAlCarrito(id) {
    const promo = promociones.find(p => p.id === id);
    const existe = carrito.find(item => item.id === id);
    
    // Le añadimos un prefijo para que en el ticket se vea diferente
    if(existe) { 
        existe.cant++; 
    } else { 
        carrito.push({...promo, nombre: "🎁 PROMO: " + promo.nombre, cant: 1}); 
    }
    actualizarTabla();
}

function toggleNuevaPromo() {
    const m = document.getElementById('modal-nueva-promo');
    m.style.display = m.style.display === 'none' ? 'flex' : 'none';
}

function guardarNuevaPromo() {
    const nombre = document.getElementById('prm-nombre').value;
    const precio = parseFloat(document.getElementById('prm-precio').value);
    const icono = document.getElementById('prm-icono').value || "⭐";

    if(!nombre || isNaN(precio)) return alert("Por favor pon nombre y precio");

    const nueva = { id: Date.now(), nombre, precio, icono };
    promociones.push(nueva);
    localStorage.setItem('promosCochita', JSON.stringify(promociones));
    
    // Limpiar y cerrar
    document.getElementById('prm-nombre').value = "";
    document.getElementById('prm-precio').value = "";
    renderPromociones();
    toggleNuevaPromo();
}

function borrarTodasPromos() {
    if(confirm("¿Seguro que quieres quitar todas las promociones actuales?")) {
        promociones = [];
        localStorage.removeItem('promosCochita');
        renderPromociones();
        toggleNuevaPromo();
    }
}