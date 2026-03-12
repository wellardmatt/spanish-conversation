# Conversación en Español – App de práctica con voz

App web para practicar español por voz y texto. La IA mantiene la conversación en español y **corrige suavemente** tus errores. Las respuestas se leen en voz alta con una voz en español.

## Qué necesitas

- **OpenAI API key** (cuenta en [platform.openai.com](https://platform.openai.com)). La app usa el modelo `gpt-4o-mini` (económico). La clave se guarda solo en tu dispositivo.

## Cómo usarla en el iPhone

### 1. Subir la app a un servidor (recomendado para voz)

Para que el **reconocimiento de voz** funcione bien en el iPhone, la página debe servirse por **HTTPS**. Opciones:

- **Opción A – GitHub Pages (gratis)**  
  1. Crea un repositorio en GitHub, sube la carpeta `spanish-conversation-app` (solo los archivos `index.html`, `app.js` y opcionalmente `README.md`).  
  2. En el repo: Settings → Pages → Source: “Deploy from a branch” → rama `main`, carpeta `/ (root)`.  
  3. En unos minutos tendrás una URL como `https://tuusuario.github.io/nombre-repo/`.

- **Opción B – Servidor local en tu Mac**  
  En la terminal, desde la carpeta del proyecto:
  ```bash
  cd spanish-conversation-app
  python3 -m http.server 8080
  ```
  En el iPhone, en Safari abre `http://TU_IP_DE_MAC:8080` (misma Wi‑Fi). Para HTTPS en local hace falta algo como ngrok.

- **Opción C – Abrir el archivo directamente**  
  Puedes abrir `index.html` desde iCloud Drive o Files. La app funcionará, pero en iOS el **micrófono puede no estar permitido** en páginas `file://`. Mejor usar una URL HTTPS (Opción A o B + ngrok).

### 2. Añadir a la pantalla de inicio (como una app)

1. Abre la URL de la app en **Safari** (no en Chrome).
2. Toca el botón **Compartir** (cuadrado con flecha).
3. Elige **“Añadir a la pantalla de inicio”**.
4. Pon un nombre (ej. “Español”) y toca **Añadir**.

A partir de ahí la abres como una app más. La primera vez que toques el micrófono, Safari pedirá permiso para usar el micrófono.

### 3. Configurar la API key

La primera vez que abras la app te pedirá la **API key de OpenAI**. Toca **“API key”** (arriba a la derecha) para cambiarla cuando quieras. Se guarda solo en tu navegador.

## Uso

- **Escribir:** escribe en el cuadro y pulsa el botón de enviar (o Enter).
- **Hablar:** toca el botón del micrófono 🎤, habla en español y espera a que se transcriba (o escribe si la voz no está disponible).
- La IA responde en español y, si hay errores, muestra **“Corregido: …”** bajo tu mensaje.
- La respuesta se **lee en voz alta** con una voz en español del sistema (o del navegador).

## Notas

- **Voz en el iPhone:** La app usa la síntesis de voz del propio iPhone (voz en español). No hace falta “voz online” extra.
- **Reconocimiento de voz en iOS:** Safari en iOS a veces limita el uso del micrófono en páginas que no son HTTPS. Si el micrófono no funciona, usa la opción de escribir.
- **Coste:** Solo pagas el uso de la API de OpenAI (gpt-4o-mini suele ser muy barato por conversación).

## Estructura del proyecto

```
spanish-conversation-app/
  index.html   # Página principal
  app.js       # Lógica: voz, API, correcciones, TTS
  README.md    # Este archivo
```
