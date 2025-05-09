# ---- STAGE 1: builder llama.cpp ----
FROM python:3.9-slim AS builder

# Instala herramientas de compilación
RUN apt-get update && apt-get install -y \
    git build-essential cmake \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copia el código de llama.cpp
COPY llama.cpp/ ./llama.cpp/

# Crea el build directory, configura CMake y compila
RUN rm -rf ./llama.cpp/build && \
    mkdir ./llama.cpp/build && \
    cd ./llama.cpp/build && \
    cmake .. \
      -DLLAMA_CURL=OFF \
      -DGGML_NEON=OFF \
      -DGGML_ACCELERATE=OFF \
      -DLLAMA_BUILD_EXAMPLES=OFF \
      -DLLAMA_BUILD_TESTS=OFF \
      -DCMAKE_BUILD_TYPE=Release && \
    make -j2

# ---- STAGE 2: final image ----
FROM python:3.9-slim

WORKDIR /app

# Copia tu código FastAPI
COPY ia-api/ /app/

# Copia el binario resultante de llama.cpp
COPY --from=builder /build/llama.cpp/build/bin/llama-cli /app/llama-cli
RUN chmod +x /app/llama-cli

# Copia tu modelo GGUF
COPY llama.cpp/models/mistral-7b-instruct-v0.1.Q4_K_M.gguf /app/mistral.gguf

# Instala dependencias Python
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
