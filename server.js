import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); // importante para base64

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.post("/analizar", async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No se recibió imagen" });
    }

    const prompt = `
    Analiza este rostro según estas categorías exactas:
    Ovalado, Redondo, Cuadrado, Diamante, Triangulo invertido, Rectangular, Triangulo.

    Responde ÚNICAMENTE en este formato JSON:
    {
      "tipo": "Nombre exacto de la categoría",
      "analisis": "Explicación breve de los rasgos detectados",
      "corte": "Peinado sugerido"
    }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",

      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64
              }
            }
          ]
        }
      ]
    });

    const texto = response.candidates[0].content.parts[0].text;

    const limpio = texto.replace(/```json|```/g, "").trim();
    const json = JSON.parse(limpio);

    res.json(json);

  } catch (error) {
    console.error("Error en backend:", error);
    res.status(500).json({ error: "Error al analizar imagen" });
  }
});

app.listen(3000, () => {
  console.log("🚀 Servidor activo en http://localhost:3000");
});
