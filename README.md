# Jewellery Retouching MVP — Ark / Arkenstone Project

## **Product Brief**
We are building an AI-powered jewellery image retouching service designed for eCommerce sellers, jewellers, and marketplaces.

The service will:
- Accept images in any common format and resolution.
- Remove backgrounds with precision to preserve fine jewellery details like prongs, chains, and facets.
- Enhance jewellery appearance by correcting tone, sharpening, and cleaning imperfections.
- Output standardised **2000x2000px** eCommerce-ready product images.
- Deliver instant results via an online interface using a cloud-based AI pipeline.
- Monetise with a simple per-image pricing model.

Target users include jewellery brands, product photographers, online jewellery marketplaces, and auction houses.

---

## **What We Have Built So Far**
- **MVP Backend** built in Python using **FastAPI**.
- Integrated with **Replicate API** for cloud-based background removal.
- Processes any uploaded image, centers it on a square white background, and resizes to 2000x2000px.
- Outputs ready-to-download PNG images.
- Hosted on **Render** (free tier) for zero-cost operation during MVP stage.
- Secure API key management with `.env` variables.
- Existing GitHub repo (`silentpacific/arkenstone`) linked to Render for continuous deployment.

---

## **Planned Full Pipeline**

### Segmentation & Fine Matting
- **Model**: RMBG 1.4 / U²-Net for coarse cut-out, then Alpha matting for precise edges (chains, prongs).
- **Goal**: Perfect mask edges before enhancement.

### Defect Cleanup (Spec/Metal Safe)
- Dust/scratch removal via inpainting (OpenCV Telea/NS).
- Keep specular highlights intact, no blurring.

### Exposure & Color Science for Metals
- White balance to D65.
- Metal-safe curves: raise mid-tones, protect highlights (clip guard ~98%).
- Selective HSL: gold saturation +5–8, silver near-neutral.

### Gemstone Brilliance
- Local contrast enhancement (CLAHE) inside gem regions.
- Small star-glint bloom for believable sparkle.
- Keep subtle to avoid "AI look".

### Super-Resolution & Sharpening
- **Real-ESRGAN** for upscaling.
- Mild unsharp mask (radius 0.6–0.8px).

### Relighting & Shadows
- Depth estimation (MiDaS).
- Soft key light simulation from top-left.
- Synthetic contact shadow + faint reflection for a "luxury studio" effect.

### Backgrounds & Scenes
- Background library: pure white, light grey, gradient slate, velvet black, pastel acrylics.
- Lifestyle composites: marble, linen, velvet — perspective matched.

### Motion (Optional)
- 3–5s parallax or zoom-in videos for product pages/ads.

### Model Try-On (Optional)
- AI placement of rings, earrings, necklaces on model images with pose-guided masking and light wrapping.

---

## **Open Components We Can Use**
- **Background Removal / Alpha Matting**: RMBG-1.4, U²-Net, Alpha Matting (local or Replicate).
- **Cleanup**: OpenCV inpainting, dust masking.
- **Gem Polish**: CLAHE + highlight bloom.
- **SR**: Real-ESRGAN.
- **Depth/Relight**: MiDaS + synthetic lighting.
- **Compositing**: Pillow, OpenCV.
- **Batch Processing**: Python script with YAML look presets.

---

## **Next Steps**
- Add enhancement stages to current MVP.
- Build "precision" and "heavy" presets.
- Implement watermark previews + payment flow.
- Expand export formats and styles.
