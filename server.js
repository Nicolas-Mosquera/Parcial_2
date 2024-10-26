require('dotenv').config(); // Cargar variables de entorno desde .env
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const app = express();

app.use(bodyParser.json());

// Conexión a MongoDB
const dbURI = process.env.MONGODB_URI || 'mongodb+srv://nicolasmosquera01:DiVMPRufK0Gk8MW9@cluster0.c5xcv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Ajusta aquí si es necesario

console.log('URI de MongoDB:', dbURI); // Verifica la URI

mongoose.connect(dbURI)
    .then(() => console.log('Conexión a MongoDB establecida'))
    .catch((error) => console.log('Error al conectar a MongoDB:', error));

// Modelos para las colecciones 'usuarios', 'intentos', 'user_info' y 'codigos'
const UsuarioSchema = new mongoose.Schema({
    nombre: String,
    apellido: String,
    numeroCelular: String,
    cedula: String,
    password: String,
    role: { type: String, default: 'user' }, // 'user' o 'admin'
}, { collection: 'usuarios' });

const CodigoSchema = new mongoose.Schema({
    codigo: String,
    premio: Number, // El valor del premio, por ejemplo, 10000, 50000, 1000000
}, { collection: 'codigos' });

const IntentoSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    codigo: String,
    esGanador: Boolean,
    fecha: { type: Date, default: Date.now },
}, { collection: 'intentos' });

const UserInfoSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    codigoGanador: String,
    premio: Number,
}, { collection: 'user_info' });

const Usuario = mongoose.model('Usuario', UsuarioSchema);
const Codigo = mongoose.model('Codigo', CodigoSchema);
const Intento = mongoose.model('Intento', IntentoSchema);
const UserInfo = mongoose.model('UserInfo', UserInfoSchema);

// Middleware para verificar token
const verificarToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ success: false, message: 'Token requerido.' });

    jwt.verify(token, 'mi_secreto', (err, decoded) => {
        if (err) return res.status(500).json({ success: false, message: 'Token inválido.' });
        req.usuario = decoded.nombre;
        next();
    });
};

// Endpoint para registro de usuario
app.post('/newuser', async (req, res) => {
    const { nombre, apellido, numeroCelular, cedula, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const nuevoUsuario = new Usuario({ nombre, apellido, numeroCelular, cedula, password: hashedPassword });

    await nuevoUsuario.save();
    res.json({ success: true, message: 'Usuario registrado exitosamente.' });
});

// Endpoint de login
app.post('/login', async (req, res) => {
    const { nombre, password } = req.body;

    const usuario = await Usuario.findOne({ nombre });
    if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
        return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos.' });
    }

    const token = jwt.sign({ nombre: usuario.nombre, role: usuario.role }, 'mi_secreto', { expiresIn: '1h' });
    res.json({ success: true, message: 'Login exitoso.', token });
});

// Endpoint para registrar un código ganador (solo accesible por administradores)
app.post('/registrarGanador', verificarToken, async (req, res) => {
    const usuario = await Usuario.findOne({ nombre: req.usuario });

    if (usuario.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Solo administradores pueden registrar códigos ganadores.' });
    }

    const { codigo, premio } = req.body;

    const codigoExistente = await Codigo.findOne({ codigo });
    if (codigoExistente) {
        return res.status(400).json({ success: false, message: 'Este código ya ha sido registrado como ganador.' });
    }

    const nuevoCodigoGanador = new Codigo({ codigo, premio });
    await nuevoCodigoGanador.save();

    res.json({ success: true, message: 'Código ganador registrado exitosamente.' });
});

// Endpoint para verificar si un código es ganador
app.post('/verificarCodigo', verificarToken, async (req, res) => {
    const { codigo } = req.body;

    const codigoGanador = await Codigo.findOne({ codigo });
    
    const nuevoIntento = new Intento({
        usuarioId: req.usuario._id, // Asegúrate de pasar el ID del usuario
        codigo,
        esGanador: !!codigoGanador,
    });

    await nuevoIntento.save(); // Guarda el intento en la base de datos

    if (codigoGanador) {
        // Si el código es ganador, guarda la información del usuario
        const nuevoUserInfo = new UserInfo({
            usuarioId: req.usuario._id, // Asegúrate de pasar el ID del usuario
            codigoGanador: codigoGanador.codigo,
            premio: codigoGanador.premio,
        });

        await nuevoUserInfo.save();

        res.json({ success: true, message: `¡Felicidades! Ganaste un premio de $${codigoGanador.premio}.`, premio: codigoGanador.premio });
    } else {
        res.json({ success: false, message: 'Lo sentimos, este código no es ganador.' });
    }
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});


