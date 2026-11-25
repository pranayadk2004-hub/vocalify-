from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from gtts import gTTS
from io import BytesIO
import requests
import html
import re

app = Flask(__name__)
CORS(app)

LANGUAGES = {
    "English": "en",
    "Hindi": "hi",
    "Marathi": "mr",
    "Gujarati": "gu",
    "Spanish": "es",
    "French": "fr",
    "German": "de"
}

def split_text(text, max_bytes=400):
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks = []
    current = ""

    for sentence in sentences:
        if len(sentence.encode("utf-8")) > max_bytes:
            words = sentence.split()
            for word in words:
                candidate = (current + " " + word).strip()
                if len(candidate.encode("utf-8")) > max_bytes:
                    if current:
                        chunks.append(current)
                    current = word
                else:
                    current = candidate
            continue

        candidate = (current + " " + sentence).strip()

        if len(candidate.encode("utf-8")) > max_bytes:
            if current:
                chunks.append(current)
            current = sentence
        else:
            current = candidate

    if current:
        chunks.append(current)

    return chunks


def translate_text(text, target_language):
    if target_language == "en":
        return text

    chunks = split_text(text)
    translated_chunks = []

    for chunk in chunks:
        response = requests.get(
            "https://api.mymemory.translated.net/get",
            params={
                "q": chunk,
                "langpair": f"en|{target_language}"
            },
            timeout=25
        )

        response.raise_for_status()
        result = response.json()

        if result.get("responseStatus") != 200:
            raise Exception(
                result.get("responseDetails", "Translation service failed")
            )

        translated = result.get("responseData", {}).get(
            "translatedText", ""
        )

        if not translated:
            raise Exception("Translation returned empty text")

        translated_chunks.append(html.unescape(translated))

    return " ".join(translated_chunks)


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/voices", methods=["GET"])
def voices():
    return jsonify(LANGUAGES)


@app.route("/api/tts", methods=["POST"])
def generate_speech():

    data = request.get_json(silent=True) or {}

    text = data.get("text", "").strip()
    language = data.get("language", "en")

    if not text:
        return jsonify({"error": "Please enter some text"}), 400

    if len(text) > 5000:
        return jsonify({"error": "Maximum 5000 characters allowed"}), 400

    if language not in LANGUAGES.values():
        return jsonify({"error": "Unsupported language"}), 400

    try:
        # STEP 1: Translate English text
        translated_text = translate_text(text, language)

        # STEP 2: Generate speech
        audio_buffer = BytesIO()

        tts = gTTS(
            text=translated_text,
            lang=language,
            slow=False
        )

        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)

        # STEP 3: Return MP3
        return send_file(
            audio_buffer,
            mimetype="audio/mpeg",
            as_attachment=False,
            download_name="vocalify_speech.mp3"
        )

    except requests.RequestException as e:
        app.logger.exception("Translation connection error")
        return jsonify({
            "error": "Translation service is unavailable. Please try again later."
        }), 503

    except Exception as e:
        app.logger.exception("Speech generation error")
        return jsonify({
            "error": str(e)
        }), 503


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )