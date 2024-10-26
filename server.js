const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const app = express();

app.use(bodyParser.json());
app.use(express.static('public')); // Servir el frontend desde la carpeta 'public'

const secretKey = 'clave-secreta';
const usuarios = [];
const codigosRegistrados = [];

// Middleware para verificar el token JWT
function verificarToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).send('Token no proporcionado.');
    }

    jwt.verify(token.split(' ')[1], secretKey, (err, decoded) => {
        if (err) {
            return res.status(403).send('Token no válido.');
        }
        req.usuario = decoded.nombre; // Nombre de usuario decodificado
        next();
    });
}

// Endpoint 1: /login - Autenticación de usuario
app.post('/login', (req, res) => {
    const { nombre, password } = req.body;
    const usuario = usuarios.find(u => u.nombre === nombre && u.password === password);

    if (usuario) {
        const token = jwt.sign({ nombre: usuario.nombre }, secretKey, { expiresIn: '1h' });
        return res.json({ success: true, token });
    } else {
        return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos.' });
    }
});

// Endpoint 2: /newuser - Registro de nuevos usuarios
app.post('/newuser', (req, res) => {
    const { nombre, password } = req.body;
    const usuarioExistente = usuarios.find(u => u.nombre === nombre);

    if (usuarioExistente) {
        return res.status(400).json({ success: false, message: 'El usuario ya existe.' });
    }

    usuarios.push({ nombre, password, role: 'user' });
    res.json({ success: true, message: 'Usuario registrado exitosamente.' });
});

// Endpoint 3: /newadmin - Registro de nuevos administradores
app.post('/newadmin', (req, res) => {
    const { nombre, password } = req.body;
    const adminExistente = usuarios.find(u => u.nombre === nombre);

    if (adminExistente) {
        return res.status(400).json({ success: false, message: 'El administrador ya existe.' });
    }

    usuarios.push({ nombre, password, role: 'admin' });
    res.json({ success: true, message: 'Administrador registrado exitosamente.' });
});

// Endpoint 4: /registrarcodigo - Registrar códigos de lotería (requiere autenticación)
app.post('/registrarcodigo', verificarToken, (req, res) => {
    const { codigo } = req.body;
    const usuario = req.usuario;

    const codigoExistente = codigosRegistrados.find(c => c.codigo === codigo);
    if (codigoExistente) {
        return res.status(400).json({ success: false, message: 'Este código ya ha sido registrado.' });
    }

    codigosRegistrados.push({ usuario, codigo });
    res.json({ success: true, message: 'Código registrado exitosamente.' });
});

// Endpoint 5: /tablauser - Mostrar los códigos registrados por el usuario (requiere autenticación)
app.get('/tablauser', verificarToken, (req, res) => {
    const usuario = req.usuario;
    const codigosUsuario = codigosRegistrados.filter(c => c.usuario === usuario);

    res.json({ success: true, codigos: codigosUsuario });
});

// Endpoint 6: /tablaadmin - Mostrar todos los códigos registrados (solo para admins)
app.get('/tablaadmin', verificarToken, (req, res) => {
    const usuario = usuarios.find(u => u.nombre === req.usuario);

    if (usuario.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Solo administradores pueden acceder a esta tabla.' });
    }

    res.json({ success: true, codigos: codigosRegistrados });
});

// Servir el frontend (public folder)
app.use(express.static('public'));

// Iniciar el servidor
app.listen(3000, () => {
    console.log('Servidor iniciado en http://localhost:3000');
});
