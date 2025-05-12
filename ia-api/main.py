from fastapi import FastAPI
from pydantic import BaseModel
import re
import subprocess
import tempfile

# Leer Mímisbrunnr.txt al iniciar
with open("Mimisbrunnr.txt", "r", encoding="utf-8") as f:
    base_info = f.read()

app = FastAPI()

class Consulta(BaseModel):
    pregunta: str

# Ruta relativa dentro del contenedor Docker
MODEL_PATH = "./mistral.gguf"

def construir_prompt(pregunta: str) -> str:
    return f"""Eres un asistente virtual de la Municipalidad de Doñihue. Tu rol es ayudar a vecinos respondiendo de forma clara y amable solo con la siguiente información oficial.

- Responde con una sola respuesta clara y breve.
- No incluyas de nuevo la información oficial.
- No repitas encabezados ni secciones del contexto.
- No debes listar todo el archivo. Solo responde con lo que sea útil para esta pregunta.
- Si no puedes responder, di exactamente: No tengo información suficiente para responder esa pregunta.

### Información oficial:
{base_info}

### Pregunta del ciudadano:
{pregunta}

### Respuesta:
"""

def llamar_llama_cpp(prompt: str) -> str:
    with tempfile.NamedTemporaryFile(mode="w+", suffix=".txt", delete=False) as tmp:
        tmp.write(prompt)
        tmp.flush()

        comando = [
            "./llama-cli",
            "-m", MODEL_PATH,
            "-f", tmp.name,
            "--n-predict", "512",
            "--temp", "0.7",
            "--top-p", "0.9",
        ]

        resultado = subprocess.run(
            comando,
            capture_output=True,
            text=True
        )

        salida = resultado.stdout

        # Buscar desde la última aparición de la pregunta real
        bloques = salida.strip().split("Pregunta:")
        ultima_pregunta = bloques[-1] if len(bloques) > 1 else salida

        # Extraer desde "Respuesta:"
        respuesta_match = re.search(r"Respuesta:\s*(.*)", ultima_pregunta, re.DOTALL)
        respuesta = respuesta_match.group(1).strip() if respuesta_match else ""

        # Limpieza adicional
        respuesta = re.sub(r"\[.*?\]", "", respuesta)
        respuesta = re.sub(r"Información.*", "", respuesta, flags=re.IGNORECASE)
        respuesta = re.sub(r"Pregunta.*", "", respuesta, flags=re.IGNORECASE)
        respuesta = respuesta.strip()

        # Detectar si el modelo devolvió un fallback genérico
        if (
            not respuesta
            or len(respuesta) < 10
            or "no tengo información suficiente" in respuesta.lower()
        ):
            return "Vecino, mi objetivo es ayudarte en lo relacionado con la municipalidad. Para otras preguntas no puedo ayudarte."

        return respuesta

@app.post("/responder")
def responder(data: Consulta):
    prompt = construir_prompt(data.pregunta)
    respuesta = llamar_llama_cpp(prompt)
    return {"respuesta": respuesta}
