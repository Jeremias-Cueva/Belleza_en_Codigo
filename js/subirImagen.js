const form = document.getElementById('form-analisis');
const inputFoto = document.getElementById('foto');
const contenedorResultado = document.getElementById('resultado');

const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
let iaLista = false;

async function inicializarIA() {
    try {
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ]);
        iaLista = true;
        console.log("Sistemas biométricos listos.");
    } catch (error) {
        console.error("Error en face-api:", error);
    }
}
document.addEventListener('DOMContentLoaded', inicializarIA);

// ... (Mantén tu código de inicialización de face-api igual)

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!iaLista || !inputFoto.files[0]) return;

    contenedorResultado.innerHTML = "<p>⌛ Analizando rasgos con IA de alta precisión...</p>";

    const file = inputFoto.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = async () => {
        try {
            const base64 = reader.result.split(',')[1];

            const response = await fetch("http://localhost:3000/analizar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageBase64: base64 })
            });

            if (!response.ok) throw new Error("Error en el servidor");

            const res = await response.json();

            // VALIDACIÓN: Solo procesar si recibimos datos válidos
            if (res && res.tipo) {
                const nombreArchivo = res.tipo.toLowerCase()
                    .replace(/ /g, "_")
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") + ".jpeg";

                mostrarResultado(res, reader.result, nombreArchivo);
            } else {
                throw new Error("Respuesta incompleta de la IA");
            }

        } catch (err) {
            console.error("Error:", err);
            contenedorResultado.innerHTML = "<p style='color:red;'>⚠️ Error al conectar con la IA. Revisa tu API Key o el servidor.</p>";
        }
    };
});

function mostrarResultado(datos, fotoUser, fotoRef) {
    contenedorResultado.innerHTML = `
        <div style="background: white; padding: 25px; border-radius: 20px; border: 2px solid #ffb7c5; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            <h2 style="color: #d81b60; margin-bottom: 20px;">Tipo detectado: ${datos.tipo}</h2>
            <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin-bottom: 20px;">
                <div style="text-align:center;">
                    <p style="font-size: 0.7rem; color: #888;">TU ROSTRO</p>
                    <img src="${fotoUser}" style="width: 150px; height: 190px; object-fit: cover; border-radius: 12px; border: 3px solid #ffb7c5;">
                </div>
                <div style="text-align:center;">
                    <p style="font-size: 0.7rem; color: #888;">REFERENCIA</p>
                    <img src="imagenes/${fotoRef}" style="width: 150px; height: 190px; object-fit: cover; border-radius: 12px; border: 3px solid #eee;" onerror="this.src='imagenes/logo.jpg'">
                </div>
            </div>
            <div style="text-align: left; background: #fff5f7; padding: 15px; border-radius: 12px;">
                <p><b>🧐 Análisis:</b> ${datos.analisis}</p>
                <p><b>💇 Corte Ideal:</b> ${datos.corte}</p>
            </div>
        </div>
    `;
}
