require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = 'tu_secreto_para_jwt'; // Cambia esto a un valor seguro en producción

const dbURI = 'mongodb+srv://nicolasmosquera01:DiVMPRufK0Gk8MW9@cluster0.c5xcv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Conectado a MongoDB"))
    .catch((error) => console.error("Error al conectar a MongoDB:", error));
// Esquema de Usuario
const userSchema = new mongoose.Schema({
    nombre: String,
    correo: String,
    password: String
});
const User = mongoose.model('User', userSchema);

// Esquema de Código
const codeSchema = new mongoose.Schema({
    codigo: Number,
    premio: String
});
const Code = mongoose.model('Code', codeSchema);

// Registro de usuario
app.post('/registrarse', async (req, res) => {
    const { nombre, correo, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = new User({ nombre, correo, password: hashedPassword });
    await nuevoUsuario.save();

    res.json({ success: true, message: 'Usuario registrado con éxito' });
});

// Inicio de sesión
app.post('/iniciar-sesion', async (req, res) => {
    const { nombre, password } = req.body;
    const usuario = await User.findOne({ nombre });

    if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
        return res.json({ success: false, message: 'Nombre o contraseña incorrectos' });
    }

    const token = jwt.sign({ id: usuario._id }, JWT_SECRET);
    res.json({ success: true, token });
});

// Verificación de código
app.post('/registrar-codigo', async (req, res) => {
    const { codigo } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) return res.status(401).json({ success: false, message: 'No autorizado' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const usuario = await User.findById(decoded.id);

        if (!usuario) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

        const codigoExistente = await Code.findOne({ codigo });
        if (codigoExistente) {
            res.json({ success: true, premio: codigoExistente.premio });
        } else {
            res.json({ success: true, premio: 'No Ganaste' });
        }
    } catch (error) {
        res.status(401).json({ success: false, message: 'Token inválido' });
    }
});

app.listen(3000, () => console.log("Servidor iniciado en http://localhost:3000"));








