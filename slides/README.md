# Linear Attention, State Spaces, and RLT

A standalone English research talk with **14 slides in total**, including the title slide.
The design and navigation follow the supplied [general-exam slides](https://github.com/yifanzhang-pro/princeton-general-exam/tree/221e5172b582f57c20a0ac4fa4a38ea1b13dd39c/slides).

Open `index.html` in a browser.
Fonts, MathJax, and figures are local, so the presentation works offline.
Keep the whole `slides/` directory together when sharing it.

Alternatively, serve it from the repository root:

```bash
python3 -m http.server 8767 --bind 127.0.0.1 --directory slides
```

Then open <http://127.0.0.1:8767>.

## Controls

- Arrow keys, Space, or Page Down: advance.
- O: slide overview.
- N: speaker notes, timing, and source links.
- F: fullscreen.
- Esc: close a dialog.
- Click a figure: enlarge, zoom, or open its original SVG.

## PDF

The exported PDF is `linear-attention-ssm-rlt.pdf` in this directory.
To export again, open the HTML in Chrome or Chromium, wait for the equations to render, and print to PDF with background graphics enabled and browser headers and footers disabled.
The print stylesheet supplies one 1280 × 720 slide per page and hides presentation controls and speaker notes.

## PowerPoint

The PowerPoint version is `linear-attention-ssm-rlt.pptx`.
Text and tables are editable, equations are vector assets, and notes include the equation source and references.
The fonts are embedded.
The original TikZ diagram crops use high-resolution images in slide view, PDF, and PowerPoint to preserve their gradient shadows across renderers.
Web enlargement retains the original SVG figures.

## Content

1. Linear Attention, State Spaces, and RLT
2. The state-space view
3. Linear attention as recurrent memory
4. The same computation in attention form
5. Selective SSMs and state-space duality
6. DeltaNet writes the retrieval error
7. Why affine updates admit a scan
8. RLT: a Transformer decoder as the recurrent cell
9. RLT’s explicit state-transition function
10. Feedback extends the computation across tokens
11. Length generalization depends on the depth split
12. Feedback frequency and parallelism
13. State size and parallel evaluation
14. The transition determines the computation

Edit prose, equations, tables, and speaker notes directly in `index.html`.
`reference.css` preserves the supplied deck’s styles, while `slides.css` contains this talk’s layout adjustments.
`slides.js` provides the reference deck’s navigation and dialogs.
Linear Attention and DeltaNet diagrams are cropped from the original note’s TikZ figures.
The SSM slide reproduces Mamba Figure 1.
RLT figures are original SVG assets reused from the reference presentation.
Figure details and source links appear in `sources.json`.

## Sources

The talk draws on [A Note on Linear Attention and State Space Models](https://github.com/yifanzhang-pro/A-Note-on-Linear-Attention-and-SSMs) and the [RLT manuscript](https://github.com/yifanzhang-pro/Recurrent-Looped-Transformer-Overleaf).
Source links appear on each slide and in its speaker notes.
`sources.json` records source revisions, local manuscript hashes, and figure provenance.
The explicit RLT state-space notation follows manuscript commit `d6a8ffe`.
Numerical results come from the manuscript’s frozen experiments.

The talk distinguishes input-conditioned affine cores from state-dependent nonlinear transitions, decoder state from total model memory, and exact SSD chunk evaluation from RLT-2’s changed feedback schedule.
It presents a comparison with SSM or DeltaNet baselines as an open experiment.

Third-party font and MathJax licenses are included in `vendor/`.
