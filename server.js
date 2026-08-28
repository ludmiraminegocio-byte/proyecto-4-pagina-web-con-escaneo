const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

const upload = multer({ dest: 'uploads/' });
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function convertirImagenParaGemini(rutaArchivo, tipoMime) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(rutaArchivo)).toString("base64"),
            mimeType: tipoMime
        },
    };
}

app.post('/api/analizar-imagen', upload.single('imagen'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se subió ninguna imagen' });
    }

    try {
        const modelo = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const imagenGemini = convertirImagenParaGemini(req.file.path, req.file.mimetype);
        const instrucciones = "Actúa como un experto en moda para una tienda boutique online llamada BENKA. Observa esta prenda y escribe un título corto, elegante y descriptivo (máximo 4 a 5 palabras). No uses comillas, ni puntos finales, solo el título.";

        const resultado = await modelo.generateContent([instrucciones, imagenGemini]);
        const respuestaIA = await resultado.response;
        const tituloGenerado = respuestaIA.text().trim();

        fs.unlinkSync(req.file.path);

        res.json({ 
            mensaje: 'Imagen analizada con éxito',
            tituloGenerado: tituloGenerado
        });

    } catch (error) {
        console.error("Error con Gemini:", error);
        res.status(500).json({ error: 'Hubo un error al procesar la imagen con IA.' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});