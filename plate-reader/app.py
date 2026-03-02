"""
ANPR - Riconoscimento targhe con Plate Recognizer API.
Soluzione dedicata esclusivamente alle targhe (non OCR generico).
"""
import os
import requests
import gradio as gr

API_URL = "https://api.platerecognizer.com/v1/plate-reader/"


def read_plate(image, api_token):
    """Invia l'immagine a Plate Recognizer e restituisce le targhe trovate."""
    if image is None:
        return "Carica un'immagine.", None
    token = (api_token or "").strip() or os.environ.get("PLATE_RECOGNIZER_TOKEN", "")
    if not token:
        return "Inserisci il tuo API Token (gratuito su platerecognizer.com)", image

    with open(image, "rb") as f:
        resp = requests.post(
            API_URL,
            files={"upload": f},
            headers={"Authorization": f"Token {token}"},
            timeout=30,
        )

    if not resp.ok:  # accetta 200, 201, 202...
        err = resp.json().get("detail", resp.text) if resp.text else str(resp.status_code)
        return f"Errore: {err}", image

    data = resp.json()
    results = data.get("results", [])
    if not results:
        return "Nessuna targa trovata.", image

    lines = []
    for r in results:
        plate = r.get("plate", "?")
        score = r.get("score", 0) * 100
        reg = r.get("region", {}).get("code", "")
        lines.append(f"**{plate}** (confidenza {score:.0f}%, regione {reg})")
    return "\n\n".join(lines), image


with gr.Blocks(title="Lettura targhe", css="footer {display: none}") as demo:
    gr.Markdown("# Lettura targhe auto (Plate Recognizer)")
    with gr.Row():
        api_input = gr.Textbox(
            label="API Token",
            placeholder="Token da app.platerecognizer.com (gratuito)",
            type="password",
        )
    img = gr.Image(label="Carica foto", type="filepath")
    with gr.Row():
        btn = gr.Button("Leggi targa")
    out_text = gr.Markdown(label="Risultato")
    out_img = gr.Image(label="Anteprima")

    btn.click(read_plate, [img, api_input], [out_text, out_img])
    img.change(read_plate, [img, api_input], [out_text, out_img])

if __name__ == "__main__":
    demo.launch()
