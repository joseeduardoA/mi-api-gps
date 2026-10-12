
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "user.json");

app.use(express.json({ limit: "10kb" }));

// Crear el archivo si todavía no existe.
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]", "utf8");
}

function leerElementos() {
    const data = fs.readFileSync(DATA_FILE, "utf8");
    const elementos = JSON.parse(data);

    if (!Array.isArray(elementos)) {
        throw new Error("El JSON debe contener un array");
    }

    return elementos;
}

function guardarElementos(elementos) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(elementos, null, 2),
        "utf8"
    );
}

function errorArchivo(res, error) {
    console.error(error);
    return res.status(500).json({
        error: "No se pudieron procesar los datos"
    });
}

// CONSULTAR TODOS
app.get("/api/elementos", (req, res) => {
    try {
        res.json(leerElementos());
    } catch (error) {
        errorArchivo(res, error);
    }
});

// AGREGAR
app.post("/api/elementos", (req, res) => {
    try {
        const { Phone, Name, Lat, Long, Active, Mesenger } = req.body;

        if (
            !Number.isSafeInteger(Phone) ||
            typeof Name !== "string"
        ) {
            return res.status(400).json({
                error: "Phone debe ser un entero y Name un texto"
            });
        }

        const elementos = leerElementos();

        if (elementos.some(el => el.Phone === Phone)) {
            return res.status(409).json({
                error: "Ese Phone ya existe"
            });
        }

        const nuevo = {
            Phone,
            Name,
            Lat: Lat ?? null,
            Long: Long ?? null,
            Active: Active ?? false,
            Mesenger: Mesenger ?? 0
        };

        elementos.push(nuevo);
        guardarElementos(elementos);

        res.status(201).json(nuevo);
    } catch (error) {
        errorArchivo(res, error);
    }
});

// ACTUALIZAR
app.put("/api/elementos/:phone", (req, res) => {
    try {
        const phone = Number(req.params.phone);

        if (!Number.isSafeInteger(phone)) {
            return res.status(400).json({
                error: "Phone inválido"
            });
        }

        const elementos = leerElementos();
        const index = elementos.findIndex(
            el => el.Phone === phone
        );

        if (index === -1) {
            return res.status(404).json({
                error: "Elemento no encontrado"
            });
        }

        // Solo aceptar campos autorizados.
        const permitidos = [
    "Name",
    "Lat",
    "Long",
    "Active",
    "Party",
    "Mesenger"
];

        for (const campo of permitidos) {
            if (Object.hasOwn(req.body, campo)) {
                elementos[index][campo] = req.body[campo];
            }
        }

        guardarElementos(elementos);
        res.json(elementos[index]);
    } catch (error) {
        errorArchivo(res, error);
    }
});

app.get("/", (req, res) => {
    res.send("API GPS funcionando");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
