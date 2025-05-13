# ---------- STAGE 1: compila llama.cpp ----------
  FROM --platform=linux/amd64 python:3.9-slim AS builder

  RUN apt-get update && apt-get install -y git build-essential cmake \
      && rm -rf /var/lib/apt/lists/*
  
  WORKDIR /build
  COPY llama.cpp/ ./llama.cpp/
  
  RUN rm -rf ./llama.cpp/build && \
      mkdir  ./llama.cpp/build && \
      cd     ./llama.cpp/build && \
      cmake .. \
        -DLLAMA_CURL=OFF \
        -DGGML_NEON=OFF \
        -DGGML_ACCELERATE=OFF \
        -DLLAMA_BUILD_EXAMPLES=OFF \
        -DLLAMA_BUILD_TESTS=OFF \
        -DCMAKE_BUILD_TYPE=Release \
        -DBUILD_SHARED_LIBS=OFF && \
      make -j2
  
  
  # ---------- STAGE 2: imagen final FastAPI ----------
  FROM --platform=linux/amd64 python:3.9-slim
  
  # Instala libgomp para OpenMP (requisito de llama-cli)
  RUN apt-get update && apt-get install -y libgomp1 \
      && rm -rf /var/lib/apt/lists/*
  
  WORKDIR /app
  
  COPY ia-api/ /app/
  COPY --from=builder /build/llama.cpp/build/bin/llama-cli /app/llama-cli
  RUN chmod +x /app/llama-cli
  
  COPY llama.cpp/models/mistral-7b-instruct-v0.1.Q4_K_M.gguf /app/mistral.gguf
  
  RUN pip install --no-cache-dir -r requirements.txt
  
  EXPOSE 8000
  CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
  