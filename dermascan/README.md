# DermaScan AI

Research/education demo of a ResNet50 skin-lesion classifier (14 classes) with flip-TTA and Grad-CAM.
**Not a medical diagnostic tool.** Images are processed in memory and never stored.

```
dermascan/
  backend/   FastAPI: POST /predict, GET /health
  frontend/  React + Tailwind (Vite)
```

## 1. Get the checkpoint
Your notebook saves the best model to `checkpoints/resnet50_best.pt` (a dict with `model_state_dict`).
Download it from Colab/Drive and put it at `backend/checkpoints/resnet50_best.pt`
(or set `CHECKPOINT_PATH`). The backend's `ResNet50Skin` class matches the notebook exactly, so the keys load.

## 2. Run the backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --port 8000
```
Check: http://localhost:8000/health and the interactive docs at http://localhost:8000/docs.

Environment variables: `CHECKPOINT_PATH`, `CONF_THRESHOLD` (0.50), `MAX_UPLOAD_MB` (10),
`CORS_ORIGINS` (comma-separated, default `http://localhost:5173`).

## 3. Run the frontend
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```
In dev, `/api/*` is proxied to `localhost:8000`, so there is no CORS setup. The header badge shows
**Live API** when the backend answers, or **Demo mode** when it does not. In demo mode the Analyze button
returns clearly labelled placeholder results so the UI still works. For production, copy `.env.example`
to `.env`, set `VITE_API_URL=https://your-api` and `VITE_ALLOW_MOCK=false`, then `npm run build`.

## API
`POST /predict` (multipart, field `file`) returns:
```json
{ "top_class": "Nevus", "confidence": 0.91, "top5": [{"label": "Nevus", "prob": 0.91}],
  "category": "Benign Skin Lesions", "malignancy_score": 0.06,
  "gradcam_overlay_base64": "<png>", "gradcam_heatmap_base64": "<png>", "low_confidence": false }
```
`gradcam_heatmap_base64` is an extra field used for the opacity slider. Categories use the notebook's names.

## Real vs illustrative data
- **Real:** headline metrics and the per-class precision/recall/F1/support table (from your notebook output).
- **Illustrative until you export:** confusion matrix, accuracy-vs-threshold curve and t-SNE.
  Add this cell at the end of the notebook, download `metrics.json`, and put it in `frontend/public/`:
```python
import json
json.dump({
  "confusion": cm.tolist(),
  "threshold_curve": [{"t": float(t), "acc": None if np.isnan(a) else float(a), "cov": float(c)}
                      for t, a, c in zip(ths, acc_t, cov_t)],
  "tsne": [{"c": int(emb_y[i]), "x": float(Z[k, 0]), "y": float(Z[k, 1])} for k, i in enumerate(idx)],
}, open("metrics.json", "w"))
```
(`null` accuracies at very high thresholds are dropped by the chart: filter them if you see gaps.)

## Safety features
Persistent disclaimer banner, required "I understand" checkbox before analysis, extra evaluation prompt for
Skin Cancer / Precancerous results, low-confidence banner under 0.50, no treatment advice, no image storage.
