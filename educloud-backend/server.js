const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const app = express();

app.use(cors());
app.use(express.json());

// RDS connection
const pool = new Pool({
  user: "postgres",
  host: "educloud-db.curk24uueenr.us-east-1.rds.amazonaws.com",
  database: "postgres",
  password: "1234abcd",
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

// S3 client
const s3 = new S3Client({ region: "us-east-1" });
const upload = multer({ storage: multer.memoryStorage() });

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "EduCloud Backend funcionando" });
});

// Login
app.post("/login", async (req, res) => {
  const { usuario, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM usuarios WHERE username = $1 AND password = $2",
      [usuario, password]
    );
    if (result.rows.length > 0) {
      return res.json({ success: true, message: "Login correcto" });
    }
    res.status(401).json({ success: false, message: "Credenciales incorrectas" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error del servidor" });
  }
});

// Test DB
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/ping", (req, res) => res.json({ pong: true }));
// Upload endpoint
app.post("/upload", upload.single("archivo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No se subió ningún archivo" });
    }
    const archivo = req.file;
    const nombreOriginal = archivo.originalname;
    const key = `materiales/${Date.now()}-${nombreOriginal}`;
    const bucket = "educloud-materiales-jose";
    
    const params = {
      Bucket: bucket,
      Key: key,
      Body: archivo.buffer,
      ContentType: archivo.mimetype,
    };
    await s3.send(new PutObjectCommand(params));
    
    res.json({
      success: true,
      message: "Archivo subido correctamente",
      url: `https://${bucket}.s3.us-east-1.amazonaws.com/${key}`,
      key: key,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/check-db", async (req, res) => {
  try {
    // Verificar conexión
    const now = await pool.query("SELECT NOW()");
    // Verificar si la tabla usuarios existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'usuarios'
      );
    `);
    let usuarios = [];
    if (tableCheck.rows[0].exists) {
      const result = await pool.query("SELECT * FROM usuarios");
      usuarios = result.rows;
    }
    res.json({
      conexion: "ok",
      hora: now.rows[0],
      tablaExiste: tableCheck.rows[0].exists,
      usuarios: usuarios
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/setup", async (req, res) => {
  try {
    // Crear tabla con columna 'username' (no 'usuario')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(50) NOT NULL
      )
    `);
    // Insertar admin si no existe
    await pool.query(`
      INSERT INTO usuarios (username, password)
      SELECT 'admin', '1234'
      WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE username = 'admin')
    `);
    const { rows } = await pool.query("SELECT * FROM usuarios");
    res.json({ success: true, message: "Tabla creada en postgres", usuarios: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// Start server
app.listen(3000, () => {
  console.log("Servidor backend corriendo en puerto 3000");
});