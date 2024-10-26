const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const app = express();

app.use(bodyParser.json());

// Conexión a MongoDB (asegúrate de usar tu URI de conexión)
const dbURI = 'mongodb://localhost:27017/miBaseDeDatos';

mongoose.connect(dbURI)
    .then(() => console.log('Conexión a MongoDB establecida'))
    .catch((error) => console.log('Error al conectar a MongoDB:', error));

// Modelos para las colecciones 'usuarios', 'intentos', 'user_info' y 'codigos'
const UsuarioSchema = new mongoose.Schema({
    nombre: String,
    apellido: String,
    celular: String,
    cedula: String,
    password: String,
}, { collection: 'usuarios' });

const CodigoSchema = new mongoose.Schema({
    codigo: String,
    premio: Number, // El valor del premio, por ejemplo, 10000, 50000, 1000000
}, { collection: 'codigos' });

const IntentoSchema = new mongoose.Schema({
    usuarioId: String,
    codigo: String,
    esGanador: Boolean,
    premio: Number,
}, { collection: 'intentos' });

const Usuario = mongoose.model('Usuario', UsuarioSchema);
const Codigo = mongoose.model('Codigo', CodigoSchema);
const Intento = mongoose.model('Intento', IntentoSchema);

// Middleware para verificar token
const verificarToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ success: false, message: 'Token requerido.' });

    jwt.verify(token, 'mi_secreto', (err, decoded) => {
        if (err) return res.status(500).json({ success: false, message: 'Token inválido.' });
        req.usuarioId = decoded.id;
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

// Endpoint para login
app.post('/login', async (req, res) => {
    const { cedula, password } = req.body;

    const usuario = await Usuario.findOne({ cedula });
    if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
        return res.status(401).json({ success: false, message: 'Cédula o contraseña incorrectos.' });
    }

    const token = jwt.sign({ id: usuario._id }, 'mi_secreto', { expiresIn: '1h' });
    res.json({ success: true, message: 'Login exitoso.', token });
});

// Endpoint para registrar un código (verificar si es ganador)
app.post('/registrarcodigo', verificarToken, async (req, res) => {
    const { codigo } = req.body;
    const codigoGanador = await Codigo.findOne({ codigo });

    if (codigoGanador) {
        const intento = new Intento({ usuarioId: req.usuarioId, codigo, esGanador: true, premio: codigoGanador.premio });
        await intento.save();
        res.json({ success: true, message: `¡Felicidades! Ganaste un premio de $${codigoGanador.premio}.`, premio: codigoGanador.premio });
    } else {
        const intento = new Intento({ usuarioId: req.usuarioId, codigo, esGanador: false });
        await intento.save();
        res.json({ success: false, message: 'Lo sentimos, este código no es ganador.' });
    }
});

// Endpoint para mostrar la tabla de códigos registrados
app.get('/tablauser', verificarToken, async (req, res) => {
    const intentos = await Intento.find({ usuarioId: req.usuarioId }).populate('usuarioId');
    res.json({ success: true, intentos });
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
