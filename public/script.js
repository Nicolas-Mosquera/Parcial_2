// Función para registrar un nuevo usuario
function registrarse() {
    const nombre = document.getElementById('nombre').value;
    const correo = document.getElementById('correo').value;
    const password = document.getElementById('password').value;
    const mensaje = document.getElementById('mensaje');

    fetch('/registrarse', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre, correo, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mensaje.textContent = 'Registro exitoso. Ahora puedes iniciar sesión.';
            mensaje.style.color = 'green';
        } else {
            mensaje.textContent = data.message;
            mensaje.style.color = 'red';
        }
    })
    .catch(error => {
        mensaje.textContent = 'Error al registrarse.';
        mensaje.style.color = 'red';
    });
}

// Función para iniciar sesión
function iniciarSesion() {
    const nombre = document.getElementById('nombre').value;
    const password = document.getElementById('password').value;
    const mensaje = document.getElementById('mensaje');

    fetch('/iniciar-sesion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Guardar token de sesión (ejemplo básico)
            localStorage.setItem('token', data.token);
            window.location.href = 'index.html'; // Redirigir al sistema de códigos
        } else {
            mensaje.textContent = data.message;
            mensaje.style.color = 'red';
        }
    })
    .catch(error => {
        mensaje.textContent = 'Error al iniciar sesión.';
        mensaje.style.color = 'red';
    });
}

// Lógica para registrar el código (requiere autenticación)
function registrarCodigo() {
    const token = localStorage.getItem('token'); // Obtener el token de sesión
    const codigo = parseInt(document.getElementById('codigo').value);
    const mensaje = document.getElementById('mensaje');

    if (codigo >= 0 && codigo <= 999) {
        fetch('/registrar-codigo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Enviar el token en el header
            },
            body: JSON.stringify({ codigo: codigo })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                mensaje.textContent = 'Código registrado correctamente';
                mensaje.style.color = 'green';
                agregarCodigoATabla(codigo, 'No Ganaste');
            } else {
                mensaje.textContent = data.message;
                mensaje.style.color = 'red';
            }
        })
        .catch(error => {
            mensaje.textContent = 'Error al registrar el código';
            mensaje.style.color = 'red';
        });
    } else {
        mensaje.textContent = 'Ingresa un código válido (000-999)';
        mensaje.style.color = 'red';
    }
}

// Función para agregar códigos a la tabla
function agregarCodigoATabla(codigo, premio) {
    const tabla = document.getElementById('tabla-codigos');
    const fila = document.createElement('tr');
    const fechaHora = new Date().toLocaleString();

    fila.innerHTML = `
        <td>${fechaHora}</td>
        <td>${codigo}</td>
        <td>${premio}</td>
    `;

    tabla.appendChild(fila);
}
