const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
app.use(bodyParser.json());

// Conexión a la base de datos local
mongoose.connect('mongodb+srv://nicolasmosquera01:<DiVMPRufK0Gk8MW9>@cluster0.c5xcv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Conexión a MongoDB establecida'))
    .catch((error) => console.log('Error al conectar a MongoDB:', error));

// Modelos para las colecciones 'usuarios' y 'codigos'
const UsuarioSchema = new mongoose.Schema({
    nombre: String,
    apellido: String,
    celular: String,
    cedula: String,
    password: String,
    role: { type: String, default: 'user' }
}, { collection: 'usuarios' });

const CodigoSchema = new mongoose.Schema({
    codigo: String,
    premio: Number // El valor del premio, por ejemplo, 10000, 50000, 1000000
}, { collection: 'codigos' });

const Usuario = mongoose.model('Usuario', UsuarioSchema);
const Codigo = mongoose.model('Codigo', CodigoSchema);

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
    const { nombre, apellido, celular, cedula, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const nuevoUsuario = new Usuario({ nombre, apellido, celular, cedula, password: hashedPassword });

    await nuevoUsuario.save();
    res.json({ success: true, message: 'Usuario registrado exitosamente.' });
});

// Endpoint para verificar si un código es ganador
app.post('/verificarCodigo', verificarToken, async (req, res) => {
    const { codigo } = req.body;

    const codigoGanador = await Codigo.findOne({ codigo });

    if (codigoGanador) {
        const usuarioGanador = await Usuario.findOne({ nombre: req.usuario });
        res.json({ success: true, message: `¡Felicidades ${usuarioGanador.nombre}! Ganaste un premio de $${codigoGanador.premio}.`, premio: codigoGanador.premio });
    } else {
        res.json({ success: false, message: 'Lo sentimos, este código no es ganador.' });
    }
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});

