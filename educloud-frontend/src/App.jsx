import { useState } from "react";

// 👇 URL de tu backend en Elastic Beanstalk
const API_BASE_URL = "http://educloud-backend-env.eba-n36abckx.us-east-1.elasticbeanstalk.com";

function App() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [logueado, setLogueado] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [resultadoSubida, setResultadoSubida] = useState("");

  const iniciarSesion = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password }),
      });
      const data = await response.json();
      if (data.success) {
        setLogueado(true);
      } else {
        setMensaje("Credenciales incorrectas");
      }
    } catch (error) {
      setMensaje("Error conectando al servidor");
    }
  };

  const subirArchivo = async () => {
    if (!archivo) {
      setResultadoSubida("Selecciona un archivo primero");
      return;
    }
    setSubiendo(true);
    setResultadoSubida("");
    const formData = new FormData();
    formData.append("archivo", archivo);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setResultadoSubida(`✅ Subido correctamente: ${data.key}`);
        setArchivo(null);
        document.getElementById("fileInput").value = "";
      } else {
        setResultadoSubida(`❌ Error: ${data.message || data.error}`);
      }
    } catch (error) {
      setResultadoSubida(`❌ Error de conexión: ${error.message}`);
    } finally {
      setSubiendo(false);
    }
  };

  if (logueado) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-800 text-white p-5">
          <h2 className="text-2xl font-bold mb-4">EduCloud</h2>
          <hr className="my-4 border-gray-600" />
          <nav>
            <p className="py-2 hover:bg-slate-700 px-3 rounded cursor-pointer">📚 Cursos</p>
            <p className="py-2 hover:bg-slate-700 px-3 rounded cursor-pointer">📝 Tareas</p>
            <p className="py-2 hover:bg-slate-700 px-3 rounded cursor-pointer">📁 Materiales</p>
            <p className="py-2 hover:bg-slate-700 px-3 rounded cursor-pointer">🎥 Clases</p>
            <p className="py-2 hover:bg-slate-700 px-3 rounded cursor-pointer">⚙ Configuración</p>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Académico</h1>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-gray-500 text-sm">Cursos activos</h3>
              <p className="text-3xl font-bold text-gray-800">6</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-gray-500 text-sm">Tareas pendientes</h3>
              <p className="text-3xl font-bold text-gray-800">12</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-gray-500 text-sm">Materiales</h3>
              <p className="text-3xl font-bold text-gray-800">28</p>
            </div>
          </div>

          {/* Upload section */}
          <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Subir material educativo</h2>
            <input
              id="fileInput"
              type="file"
              onChange={(e) => setArchivo(e.target.files[0])}
              className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              onClick={subirArchivo}
              disabled={subiendo}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-50"
            >
              {subiendo ? "Subiendo..." : "Subir archivo"}
            </button>
            {resultadoSubida && (
              <p className="mt-4 text-sm font-medium text-gray-700">{resultadoSubida}</p>
            )}
          </div>

          {/* Últimos cursos */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Últimos cursos</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>Matemática</li>
              <li>Comunicación</li>
              <li>Ciencia y Tecnología</li>
              <li>Historia</li>
            </ul>
          </div>
        </main>
      </div>
    );
  }

  // Pantalla de login
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-800">
      <div className="bg-slate-700 p-8 rounded-2xl shadow-lg w-96">
        <h1 className="text-3xl font-bold text-white mb-2">EduCloud</h1>
        <p className="text-gray-300 mb-6">Inicio de sesión</p>
        <input
          type="text"
          placeholder="Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-slate-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-6 rounded-lg bg-slate-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={iniciarSesion}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
        >
          Ingresar
        </button>
        {mensaje && <p className="mt-4 text-center text-red-400">{mensaje}</p>}
      </div>
    </div>
  );
}

export default App;