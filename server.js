const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Crear carpeta uploads y archivo JSON si no existen
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}
if (!fs.existsSync('./productos.json')) {
    fs.writeFileSync('./productos.json', '[]');
}

// Servir archivos estáticos y carpeta de imágenes
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar Multer para almacenar y renombrar imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, 'foto-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Endpoint para simular el reconocimiento con Inteligencia Artificial
app.post('/api/analizar-ia', upload.single('imagen'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ninguna imagen para analizar.' });
        }
        res.json({
            titulo: "Prenda de diseño minimalista",
            descripcion: "Artículo de alta calidad detectado automáticamente por reconocimiento visual."
        });
    } catch (error) {
        res.status(500).json({ error: "Error al procesar la imagen con IA" });
    }
});

// Endpoint para guardar el producto con contraseña de administrador
app.post('/api/productos', upload.single('imagen'), (req, res) => {
    const { titulo, descripcion, precio, password } = req.body;
    
    const PASSWORD_ADMIN = "123456"; // Puedes cambiar esta contraseña de administrador aquí

    if (password !== PASSWORD_ADMIN) {
        return res.status(401).json({ message: 'Contraseña de administrador incorrecta.' });
    }
    
    if (!req.file) {
        return res.status(400).json({ message: 'No se subió ninguna imagen.' });
    }

    const productosGuardados = JSON.parse(fs.readFileSync('./productos.json', 'utf-8'));
    
    const nuevoProducto = {
        id: Date.now(),
        titulo: titulo || "Sin título",
        descripcion: descripcion || "",
        precio: precio || "0",
        imagen: req.file.filename
    };

    productosGuardados.push(nuevoProducto);
    fs.writeFileSync('./productos.json', JSON.stringify(productosGuardados, null, 2));

    res.json({ message: '¡Producto publicado con éxito en el catálogo!' });
});

// Endpoint para enviar la lista de productos al Frontend
app.get('/api/productos', (req, res) => {
    const productos = JSON.parse(fs.readFileSync('./productos.json', 'utf-8'));
    res.json(productos);
});

// Iniciar servidor adaptado para Render / entornos locales
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});