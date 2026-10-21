"""DermaScan AI - FastAPI backend.
Loads the ResNet50 checkpoint trained in skin_disease.ipynb (resnet50_best.pt),
runs flip-TTA inference, builds Grad-CAM from backbone.layer4[-1].
Images are processed in memory only and never written to disk.
Research / educational use only. Not a medical diagnostic tool.
"""
import base64, io, os, threading

import numpy as np
import torch, torch.nn as nn, torch.nn.functional as F
import torchvision.models as tv_models
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from matplotlib import colormaps
from PIL import Image, ImageFile, ImageOps
from torchvision import transforms

ImageFile.LOAD_TRUNCATED_IMAGES = True

CHECKPOINT = os.getenv("CHECKPOINT_PATH", "checkpoints/resnet50_best.pt")
THRESHOLD = float(os.getenv("CONF_THRESHOLD", "0.50"))
MAX_BYTES = int(os.getenv("MAX_UPLOAD_MB", "10")) * 1024 * 1024
ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
IMG_SIZE, DROPOUT = 224, 0.3
MEAN, STD = [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Same order as the notebook (CLASS_NAMES) - do not reorder.
CLASS_NAMES = ["Normal Skin", "Acne", "Actinic Keratosis", "Basal Cell Carcinoma",
    "Chickenpox", "Dyshidrotic Eczema", "Melanoma", "Nevus", "Nail Fungus",
    "Pigmented Benign Keratosis", "Ringworm", "Seborrheic Keratosis",
    "Squamous Cell Carcinoma", "Vascular Lesion"]
LEAF_TO_CATEGORY = {
    "Normal Skin": "Normal",
    "Melanoma": "Skin Cancer", "Basal Cell Carcinoma": "Skin Cancer", "Squamous Cell Carcinoma": "Skin Cancer",
    "Actinic Keratosis": "Precancerous Lesion",
    "Nevus": "Benign Skin Lesions", "Seborrheic Keratosis": "Benign Skin Lesions",
    "Pigmented Benign Keratosis": "Benign Skin Lesions", "Vascular Lesion": "Benign Skin Lesions",
    "Acne": "Inflammatory Skin Diseases", "Dyshidrotic Eczema": "Inflammatory Skin Diseases",
    "Ringworm": "Infectious Skin Diseases", "Nail Fungus": "Infectious Skin Diseases",
    "Chickenpox": "Infectious Skin Diseases"}
CANCER_IDS = [i for i, c in enumerate(CLASS_NAMES) if LEAF_TO_CATEGORY[c] == "Skin Cancer"]

eval_tf = transforms.Compose([transforms.Resize((IMG_SIZE, IMG_SIZE)),
                              transforms.ToTensor(), transforms.Normalize(MEAN, STD)])


class ResNet50Skin(nn.Module):  # must match the notebook so state_dict keys line up
    def __init__(self, num_classes=len(CLASS_NAMES)):
        super().__init__()
        net = tv_models.resnet50(weights=None)  # fine-tuned weights come from the checkpoint
        feat = net.fc.in_features
        net.fc = nn.Identity()
        self.backbone = net
        self.head = nn.Sequential(nn.Dropout(DROPOUT), nn.Linear(feat, num_classes))

    def forward(self, x):
        return self.head(self.backbone(x))


def load_model():
    if not os.path.isfile(CHECKPOINT):
        raise RuntimeError(f"Checkpoint not found: {CHECKPOINT} (set CHECKPOINT_PATH)")
    m = ResNet50Skin()
    ckpt = torch.load(CHECKPOINT, map_location="cpu")
    m.load_state_dict(ckpt["model_state_dict"] if "model_state_dict" in ckpt else ckpt)
    return m.to(DEVICE).eval()


model = load_model()
lock = threading.Lock()  # forward hooks / grads are not thread-safe on a shared model

app = FastAPI(title="DermaScan AI API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=ORIGINS, allow_methods=["GET", "POST"], allow_headers=["*"])


def b64_png(arr_uint8: np.ndarray) -> str:
    buf = io.BytesIO()
    Image.fromarray(arr_uint8).save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def tta_probs(x):
    with torch.no_grad():
        p = F.softmax(model(x), 1) + F.softmax(model(torch.flip(x, [3])), 1)
    return (p / 2)[0].cpu().numpy()


def gradcam(x, class_idx):
    """Grad-CAM on backbone.layer4[-1] for class_idx -> HxW array in [0,1]."""
    store, layer = {}, model.backbone.layer4[-1]

    def fwd(_m, _i, o):
        store["a"] = o.detach()
        o.register_hook(lambda g: store.__setitem__("g", g.detach()))

    h = layer.register_forward_hook(fwd)
    try:
        with torch.enable_grad():
            model.zero_grad(set_to_none=True)
            model(x)[0, class_idx].backward()
    finally:
        h.remove()
    w = store["g"].mean((2, 3), keepdim=True)
    cam = F.relu((w * store["a"]).sum(1, keepdim=True))
    cam = F.interpolate(cam, size=x.shape[2:], mode="bilinear", align_corners=False)[0, 0].cpu().numpy()
    return (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)


@app.get("/health")
def health():
    return {"status": "ok", "device": str(DEVICE), "classes": len(CLASS_NAMES), "threshold": THRESHOLD}


@app.post("/predict")
def predict(file: UploadFile = File(...)):
    raw = file.file.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise HTTPException(413, f"Image too large (max {MAX_BYTES // 2**20} MB).")
    try:
        img = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert("RGB")
    except Exception:
        raise HTTPException(400, "Could not read the file as an image (use JPG, PNG or WebP).")
    del raw

    x = eval_tf(img).unsqueeze(0).to(DEVICE)
    with lock:
        probs = tta_probs(x)
        top = int(probs.argmax())
        cam = gradcam(x, top)

    heat = (colormaps["jet"](cam)[:, :, :3] * 255).astype(np.uint8)
    orig = np.array(img.resize((IMG_SIZE, IMG_SIZE))).astype(np.float32) / 255.0
    overlay = 0.5 * orig + 0.5 * heat.astype(np.float32) / 255.0
    name = CLASS_NAMES[top]
    return {
        "top_class": name,
        "confidence": float(probs[top]),
        "top5": [{"label": CLASS_NAMES[i], "prob": float(probs[i])} for i in np.argsort(-probs)[:5]],
        "category": LEAF_TO_CATEGORY[name],
        "malignancy_score": float(probs[CANCER_IDS].sum()),
        "gradcam_overlay_base64": b64_png((overlay * 255).astype(np.uint8)),
        "gradcam_heatmap_base64": b64_png(heat),  # extra: lets the UI do the opacity slider
        "low_confidence": bool(probs[top] < THRESHOLD),
    }
