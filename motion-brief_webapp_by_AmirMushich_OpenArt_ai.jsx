import { useState, useRef, useEffect } from "react";

const OPENART_LOGO = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1600" preserveAspectRatio="xMidYMid meet"><path fill="rgb(0,0,0)" d="M 1030.98 472.424 C 1116.62 467.836 1189.62 488.645 1258.06 541.217 C 1328.71 595.829 1373.33 677.228 1383.18 765.592 C 1402.76 941.229 1272.24 1105.74 1096.11 1126.35 C 1012.4 1136.99 927.771 1115.34 859.448 1065.81 C 838.884 1051.06 812.569 1027.15 792.233 1010.44 C 746.964 973.108 701.414 936.116 655.587 899.469 C 665.849 888.668 686.236 873.296 698.514 863.622 C 710.219 854.4 726.901 840.47 738.932 832.421 C 806.111 882.088 870.118 942.675 938.809 990.449 C 960.028 1005.21 1002.26 1018.39 1027.8 1021.11 C 1087.49 1027.37 1147.25 1009.88 1194.13 972.402 C 1290.91 894.645 1306.39 762.581 1230.78 663.898 C 1159.55 570.935 1022.56 550.246 926.824 617.087 C 906.642 631.178 886.043 649.642 866.883 665.41 L 774.127 740.748 C 683.056 813.729 591.603 886.232 499.773 958.255 L 421.023 1020.17 C 391.481 1043.65 363.589 1071.76 324.418 1076.03 C 268.05 1082.18 219.322 1036.83 216.284 981.2 C 215.051 958.613 215.661 935.306 215.589 912.633 L 215.445 780.934 L 215.661 673.964 C 215.724 655.859 214.95 626.989 217.587 610.043 C 220.549 590.583 228.836 572.322 241.532 557.28 C 258.211 537.611 282.016 525.367 307.717 523.238 C 321.314 522.23 348.678 526.905 360.002 533.743 C 387.928 550.606 418.938 577.778 444.709 598.936 C 486.62 633.343 532.202 667.66 572.705 703.012 C 567.022 711.369 504.853 760.117 493.335 769.543 C 478.982 759.893 463.866 747.549 450.3 736.581 C 407.982 702.369 363.693 669.578 321.633 635.175 C 322.995 649.907 322.301 669.16 322.225 684.448 L 321.949 761.842 C 321.8 828.517 323.247 897.306 322.296 963.668 C 332.556 956.488 346.833 944.644 356.95 936.766 L 436.406 874.423 C 534.692 797.622 632.183 719.808 728.862 640.993 C 755.828 619.254 782.666 597.356 809.374 575.3 C 836.516 552.837 859.071 531.531 890.232 514.347 C 936.621 488.767 978.571 475.38 1030.98 472.424 z"/></svg>`;

const PRICING = {
  "animated-gif-batch": { label: "Animated GIF (batch/derivative)", range: "$150–400" },
  "animated-gif-custom": { label: "Animated GIF (custom concept)", range: "$400–750" },
  "email-hero-small": { label: "Email hero / banner (smaller client)", range: "$500–1,200" },
  "email-hero-large": { label: "Email hero / banner (bigger brand)", range: "$1,200–2,000+" },
  "brand-loop": { label: "Short brand loop (5–15s)", range: "$800–2,500" },
  "logo-reveal": { label: "Logo reveal / brand intro", range: "$750–2,000" },
  "full-package": { label: "Full brand motion package", range: "$3,000–5,000+" },
};

const REGIONAL = [
  { label: "US / Canada / Australia", coeff: "1.0×", note: "Base rate" },
  { label: "Japan / UK / UAE / Singapore", coeff: "0.8–0.9×", note: "" },
  { label: "Spain / France / South Korea", coeff: "0.6–0.8×", note: "" },
  { label: "Brazil / Mexico / Turkey", coeff: "0.3–0.5×", note: "" },
  { label: "India / Indonesia / Vietnam", coeff: "0.2–0.35×", note: "" },
];

const CHANNELS = [
  { level: "Level 1", title: "Direct to Brand", buyers: ["DTC brands (Shopify-based)", "Early-stage startups", "Small businesses running paid ads", "Founders building pitch decks"], platforms: ["Contra", "Dribbble", "LinkedIn"], note: "Strong portfolio on Dribbble or Contra + sharp LinkedIn profile with motion samples." },
  { level: "Level 2", title: "Brandbook Upsell", buyers: ["Existing design clients", "Startup founders mid-rebrand", "Marketing leads at growing companies"], platforms: ["Your existing client list"], note: "No extra pitch needed. Frame it as standard in your process." },
  { level: "Level 3", title: "Agency White-Label", buyers: ["Branding agencies 5–50 people with weak or absent motion", "Design subscription agencies", "SaaS / fintech / AI brand studios"], platforms: ["LinkedIn prospecting", "Cold email (30–50 targets per batch)"], note: "Day rate: $500–800/day internally. Agency marks up 2–3× to end client." },
];

// ── API CALLS ──────────────────────────────────────────────────────

async function analyzeImageWithClaude(base64Data, mediaType) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64Data }
          },
          {
            type: "text",
            text: `You are a motion design director analyzing a brand image to propose Seedance 2.0 animation directions.

Analyze this image and return ONLY a valid JSON object — no preamble, no markdown, no backticks — with this exact structure:
{
  "brand_read": "2-3 sentence description of what you see: dominant material, color language, weight, mood, and visual energy",
  "ideas": [
    { "name": "3-4 word styled name", "desc": "One sentence describing the animation — camera, motion, light, material behavior. Specific to THIS image." },
    { "name": "3-4 word styled name", "desc": "One sentence describing the animation — camera, motion, light, material behavior. Specific to THIS image." },
    { "name": "3-4 word styled name", "desc": "One sentence describing the animation — camera, motion, light, material behavior. Specific to THIS image." }
  ]
}

Rules:
- All 3 ideas must be grounded in the specific visual DNA of this image
- No generic suggestions — reference the actual material, color, form, or texture you see
- Each idea must be a different animation approach (light reveal / camera movement / material transformation)
- Keep desc under 20 words`
          }
        ]
      }]
    })
  });
  if (!response.ok) { const errText = await response.text(); throw new Error('API ' + response.status + ': ' + errText.slice(0, 200)); }
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
  const clean = text.replace(/^[`]{3}(?:json)?\s*/i, '').replace(/\s*[`]{3}\s*$/i, '').trim();
  try { return JSON.parse(clean); } catch(e) { const m = clean.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); throw new Error('Parse failed: ' + clean.slice(0, 200)); }
}

async function generateSeedancePrompt(base64Data, mediaType, ideaName, ideaDesc, brandRead) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64Data }
          },
          {
            type: "text",
            text: `You are writing a production-ready Seedance 2.0 video generation prompt for this brand image.

Image analysis: ${brandRead}
Chosen animation direction: "${ideaName}" — ${ideaDesc}

Write a single Seedance 2.0 prompt. Start with: "Using the image provided as Image 1 —"

The prompt must include all 6 elements in this order:
1. SUBJECT: What the brand element is and how it looks (reference specific visual qualities from the image)
2. ACTION: Exact motion — what moves, how, at what pace
3. ENVIRONMENT: Background, surface, atmosphere
4. CAMERA: Shot size, movement type, duration in seconds
5. VISUAL STYLE: Lighting setup, material behavior, color grade, render quality
6. SOUND DESIGN: Audio instruction (usually "no audio — visual only" for brand loops)

End with: "Seamless loop."

Write the prompt as one continuous paragraph, no section headers, no bullet points. Under 120 words. Production quality — specific, actionable, no vague adjectives.`
          }
        ]
      }]
    })
  });
  const data = await response.json();
  return data.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
}

// ── UI COMPONENTS ──────────────────────────────────────────────────

function ChoiceButton({ label, sublabel, onClick, selected }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "block", width: "100%", textAlign: "left",
        padding: "14px 18px", marginBottom: 8,
        border: selected ? "2px solid #000" : "1.5px solid #000",
        borderRadius: 10,
        background: selected ? "#000" : "#fff",
        color: selected ? "#fff" : "#000",
        fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 600,
        cursor: "pointer", letterSpacing: "-0.02em", transition: "all 0.15s ease",
      }}
    >
      {label}
      {sublabel && <span style={{ display: "block", fontWeight: 400, fontSize: 12, marginTop: 2, opacity: 0.65 }}>{sublabel}</span>}
    </button>
  );
}

function Tag({ text }) {
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px",
      border: "1px solid #000", borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
      textTransform: "uppercase", marginRight: 6, marginBottom: 6,
      fontFamily: "'Manrope', sans-serif",
    }}>{text}</span>
  );
}

function Divider() {
  return <div style={{ borderTop: "1px solid #e8e8e8", margin: "28px 0" }} />;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        padding: "10px 20px", background: "#000", color: "#fff", border: "none",
        borderRadius: 8, fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 700,
        cursor: "pointer", letterSpacing: "-0.01em", marginTop: 12, transition: "opacity 0.15s",
      }}
    >{copied ? "Copied ✓" : "Copy prompt"}</button>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0", gap: 16 }}>
      <div style={{
        width: 32, height: 32, border: "2.5px solid #e0e0e0",
        borderTopColor: "#000", borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────

export default function MotionBrief() {
  const [step, setStep] = useState(0);
  const [path, setPath] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);   // { base64, mediaType, previewUrl }
  const [brandRead, setBrandRead] = useState("");
  const [aiIdeas, setAiIdeas] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [generationStatus, setGenerationStatus] = useState(null);
  const [iterationIssue, setIterationIssue] = useState(null);
  const [otherIssueText, setOtherIssueText] = useState("");
  const [activeTab, setActiveTab] = useState("assistant");
  const [pricingDeliverable, setPricingDeliverable] = useState(null);
  const [pricingRegion, setPricingRegion] = useState(null);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [step, generationStatus, iterationIssue, isAnalyzing, isGeneratingPrompt]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const mediaType = file.type || "image/jpeg";
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target.result;
      const base64 = dataUrl.split(",")[1];
      const previewUrl = dataUrl;
      setUploadedImage({ base64, mediaType, previewUrl });
      setAnalyzeError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!uploadedImage) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const result = await analyzeImageWithClaude(uploadedImage.base64, uploadedImage.mediaType);
      setBrandRead(result.brand_read);
      setAiIdeas(result.ideas);
      setStep(1);
    } catch (err) {
      setAnalyzeError("Analysis failed: " + (err.message || "Unknown error"));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGeneratePrompt = async (idea) => {
    setSelectedIdea(idea);
    setIsGeneratingPrompt(true);
    setGeneratedPrompt("");
    try {
      const prompt = await generateSeedancePrompt(
        uploadedImage.base64,
        uploadedImage.mediaType,
        idea.name,
        idea.desc,
        brandRead
      );
      setGeneratedPrompt(prompt);
      setStep(4);
    } catch (err) {
      setGeneratedPrompt("Prompt generation failed. Please try again.");
      setStep(4);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const resetAll = () => {
    setStep(0); setPath(null); setUploadedImage(null); setBrandRead("");
    setAiIdeas([]); setSelectedIdea(null); setGeneratedPrompt("");
    setGenerationStatus(null); setIterationIssue(null); setOtherIssueText("");
    setAnalyzeError(null);
  };

  const styles = {
    wrap: { fontFamily: "'Manrope', sans-serif", background: "#fff", minHeight: "100vh", color: "#000", letterSpacing: "-0.02em" },
    header: { borderBottom: "1.5px solid #000", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" },
    logoWrap: { display: "flex", alignItems: "center", gap: 10 },
    logoSvg: { width: 28, height: 28 },
    logoText: { fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" },
    poweredBy: { fontSize: 11, color: "#666", fontWeight: 600, letterSpacing: "0.02em" },
    tabBar: { display: "flex", borderBottom: "1.5px solid #000" },
    tab: (active) => ({ flex: 1, padding: "12px 0", textAlign: "center", fontWeight: 700, fontSize: 13, cursor: "pointer", background: active ? "#000" : "#fff", color: active ? "#fff" : "#000", border: "none", fontFamily: "'Manrope', sans-serif", letterSpacing: "-0.01em", transition: "all 0.15s" }),
    body: { padding: "28px 24px", maxWidth: 560, margin: "0 auto" },
    stepLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#999", marginBottom: 6 },
    heading: { fontSize: 22, fontWeight: 700, lineHeight: 1.15, marginBottom: 12, letterSpacing: "-0.03em" },
    body_text: { fontSize: 14, lineHeight: 1.6, color: "#333", marginBottom: 16 },
    prompt_box: { background: "#f7f7f7", border: "1.5px solid #000", borderRadius: 10, padding: 18, fontSize: 13, lineHeight: 1.7, color: "#000", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", marginTop: 16 },
    link: { color: "#000", fontWeight: 700, textDecoration: "underline" },
    section_title: { fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10, marginTop: 24 },
    card: { border: "1.5px solid #e0e0e0", borderRadius: 10, padding: 16, marginBottom: 12 },
    card_title: { fontWeight: 700, fontSize: 14, marginBottom: 4 },
    card_sub: { fontSize: 13, color: "#555", lineHeight: 1.5 },
    price_big: { fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", margin: "12px 0 4px" },
    note: { fontSize: 12, color: "#888", lineHeight: 1.5, marginTop: 8 },
    textarea: { width: "100%", border: "1.5px solid #000", borderRadius: 8, padding: "10px 14px", fontFamily: "'Manrope', sans-serif", fontSize: 13, letterSpacing: "-0.01em", outline: "none", boxSizing: "border-box", resize: "vertical", minHeight: 72 },
  };

  const PrimaryBtn = ({ label, onClick, full, disabled }) => (
    <button onClick={onClick} disabled={disabled} style={{ padding: "12px 22px", background: disabled ? "#ccc" : "#000", color: "#fff", border: "none", borderRadius: 8, fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", letterSpacing: "-0.01em", width: full ? "100%" : "auto", marginTop: 8, marginBottom: 4 }}>{label}</button>
  );

  // ── ASSISTANT TAB ──────────────────────────────────────────────

  const renderAssistant = () => {

    // STEP 0 — Image Upload
    if (step === 0) return (
      <div>
        <div style={styles.stepLabel}>Motion Brief</div>
        <div style={styles.heading}>Amir's Branded Motion Assistant.</div>
        <div style={styles.body_text}>
          Here's what we'll do together:<br />
          → Analyze your brand image with AI<br />
          → Build a production-ready Seedance 2.0 prompt<br />
          → Show you how to turn it into real revenue
        </div>

        <div style={styles.section_title}>Upload your brand image</div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>Logo, mockup, product shot, brand element — anything works.</div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        {!uploadedImage ? (
          <div
            onClick={() => fileInputRef.current.click()}
            style={{
              border: "2px dashed #ccc", borderRadius: 12, padding: "40px 24px",
              textAlign: "center", cursor: "pointer", marginBottom: 16,
              transition: "border-color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#000"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#ccc"}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>↑</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Click to upload image</div>
            <div style={{ fontSize: 12, color: "#999" }}>JPG, PNG, WEBP · Max 5MB</div>
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <img
              src={uploadedImage.previewUrl}
              alt="Uploaded brand image"
              style={{ width: "100%", maxHeight: 240, objectFit: "contain", border: "1.5px solid #e0e0e0", borderRadius: 10, background: "#f7f7f7" }}
            />
            <button
              onClick={() => { setUploadedImage(null); setAnalyzeError(null); }}
              style={{ fontSize: 12, color: "#888", background: "none", border: "none", cursor: "pointer", padding: "6px 0", textDecoration: "underline" }}
            >Remove and upload a different image</button>
          </div>
        )}

        {analyzeError && (
          <div style={{ fontSize: 13, color: "#c00", padding: "10px 14px", background: "#fff0f0", borderRadius: 8, marginBottom: 12 }}>{analyzeError}</div>
        )}

        {isAnalyzing ? (
          <>
            <Spinner />
            <div style={{ textAlign: "center", fontSize: 13, color: "#888" }}>Analyzing your image...</div>
          </>
        ) : (
          <PrimaryBtn
            label="Analyze my image →"
            full
            disabled={!uploadedImage}
            onClick={handleAnalyze}
          />
        )}
      </div>
    );

    // STEP 1 — Path selection
    if (step === 1) return (
      <div>
        <div style={styles.stepLabel}>Step 1 of 5</div>
        <div style={styles.heading}>Do you have a project in mind?</div>
        {brandRead && (
          <div style={{ fontSize: 13, color: "#555", padding: "12px 14px", background: "#f7f7f7", borderRadius: 8, marginBottom: 20, lineHeight: 1.6 }}>
            <strong style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#999", display: "block", marginBottom: 4 }}>What I see in your image</strong>
            {brandRead}
          </div>
        )}
        <ChoiceButton label="Yes — I have a client or project ready" sublabel="Path A: focus on delivery, pitch language, channel strategy" selected={path === "A"} onClick={() => setPath("A")} />
        <ChoiceButton label="Help me figure out how to turn this into revenue" sublabel="Path B: portfolio building, finding buyers, first pitch" selected={path === "B"} onClick={() => setPath("B")} />
        {path && <PrimaryBtn label="Continue →" full onClick={() => setStep(2)} />}
      </div>
    );

    // STEP 2 — Monetization context
    if (step === 2) return (
      <div>
        <div style={styles.stepLabel}>Step 2 of 5</div>
        <div style={styles.heading}>Before we build your prompt.</div>
        <div style={styles.body_text}>An animated version of this asset has three immediate revenue channels:</div>
        <div style={{ borderLeft: "3px solid #000", paddingLeft: 16, marginBottom: 20 }}>
          {path === "A" ? <>
            <p style={{ margin: "0 0 10px", fontSize: 14, lineHeight: 1.6 }}>→ <strong>Email campaigns</strong> — animated GIFs lift CTR 20–30% over static. Direct client deliverable.</p>
            <p style={{ margin: "0 0 10px", fontSize: 14, lineHeight: 1.6 }}>→ <strong>Paid social ads</strong> — looping brand videos outperform static in first 3 seconds of attention.</p>
            <p style={{ margin: "0 0 10px", fontSize: 14, lineHeight: 1.6 }}>→ <strong>Pitch decks & presentations</strong> — motion brand intro adds perceived value to client-facing materials.</p>
          </> : <>
            <p style={{ margin: "0 0 10px", fontSize: 14, lineHeight: 1.6 }}>→ <strong>Portfolio piece</strong> — a single strong motion asset on Dribbble or Contra gets you seen by brand buyers.</p>
            <p style={{ margin: "0 0 10px", fontSize: 14, lineHeight: 1.6 }}>→ <strong>Cold outreach anchor</strong> — use the video as the opening hook in agency or brand outreach.</p>
            <p style={{ margin: "0 0 10px", fontSize: 14, lineHeight: 1.6 }}>→ <strong>Brandbook upsell</strong> — motion add-on is standard scope for any static brand project you've done.</p>
          </>}
        </div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>We'll come back to these once your video is ready.</div>
        <PrimaryBtn label="Show me animation directions →" full onClick={() => setStep(3)} />
      </div>
    );

    // STEP 3 — AI-generated animation ideas
    if (step === 3) return (
      <div>
        <div style={styles.stepLabel}>Step 3 of 5</div>
        <div style={styles.heading}>Three directions for your image.</div>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>Each direction is based on what I see in your specific image. Pick one — I'll build the full Seedance prompt.</div>

        {isGeneratingPrompt ? (
          <>
            <Spinner />
            <div style={{ textAlign: "center", fontSize: 13, color: "#888" }}>Building your Seedance prompt...</div>
          </>
        ) : (
          <>
            {aiIdeas.map((idea, i) => (
              <ChoiceButton
                key={idea.name}
                label={`${["①","②","③"][i]} ${idea.name}`}
                sublabel={idea.desc}
                selected={selectedIdea?.name === idea.name}
                onClick={() => setSelectedIdea(idea)}
              />
            ))}
            <ChoiceButton
              label="Mix elements — I want something different"
              sublabel="Combine directions from all three"
              selected={selectedIdea?.name === "Mix"}
              onClick={() => setSelectedIdea({ name: "Mix", desc: "Custom combination of all three directions" })}
            />
            {selectedIdea && (
              <PrimaryBtn
                label="Generate prompt →"
                full
                onClick={() => handleGeneratePrompt(selectedIdea)}
              />
            )}
          </>
        )}
      </div>
    );

    // STEP 4 — Prompt output
    if (step === 4) return (
      <div>
        <div style={styles.stepLabel}>Step 4 of 5</div>
        <div style={styles.heading}>Your production-ready Seedance prompt.</div>
        <div style={styles.prompt_box}>{generatedPrompt}</div>
        <CopyButton text={generatedPrompt} />
        <Divider />
        <div style={styles.section_title}>How to run this in Seedance on OpenArt</div>
        <div style={{ fontSize: 14, lineHeight: 1.8, color: "#333" }}>
          → Go to <a href="https://amirmushich.link/SD2" target="_blank" style={styles.link}>amirmushich.link/SD2</a><br />
          → Upload your brand image as Image 1<br />
          → Paste this prompt exactly<br />
          → Duration: 4–6s for brand loops, up to 10s for narrative reveals<br />
          → Aspect: 1:1 for social · 16:9 for ads & decks · 9:16 for Stories
        </div>
        <div style={{ fontSize: 12, color: "#888", marginTop: 10, marginBottom: 20 }}>
          Need static brand prompts too? <a href="https://amirmushich.link/catalog" target="_blank" style={{ color: "#000", fontWeight: 700 }}>amirmushich.link/catalog</a> — 1.8M views. Steal freely.
        </div>
        <Divider />
        <div style={styles.section_title}>How did the generation go?</div>
        {[
          { key: "great", label: "It worked great — what do I do with it now?" },
          { key: "mostly", label: "Mostly worked — but something is off" },
          { key: "notwork", label: "Did not work at all — let's fix the prompt" },
          { key: "notyet", label: "Have not generated yet — still setting up" },
        ].map(o => (
          <ChoiceButton key={o.key} label={o.label} selected={generationStatus === o.key} onClick={() => {
            setGenerationStatus(o.key);
            if (o.key === "great") setStep(5);
            if (o.key === "mostly" || o.key === "notwork") { setIterationIssue(null); setStep(6); }
          }} />
        ))}
        {generationStatus === "notyet" && (
          <div style={{ fontSize: 13, color: "#555", marginTop: 8, padding: "12px 14px", background: "#f7f7f7", borderRadius: 8 }}>
            No rush. The link again: <a href="https://amirmushich.link/SD2" target="_blank" style={styles.link}>amirmushich.link/SD2</a>. Select an option once you've tried it.
          </div>
        )}
      </div>
    );

    // STEP 5 — Monetization
    if (step === 5) return (
      <div>
        <div style={styles.stepLabel}>Step 5 of 5</div>
        <div style={styles.heading}>You have something worth showing.</div>
        {path === "A" ? (
          <>
            <div style={styles.body_text}>Here's how to position it:</div>
            <div style={{ borderLeft: "3px solid #000", paddingLeft: 16, marginBottom: 20 }}>
              <p style={{ margin: "0 0 10px", fontSize: 14, lineHeight: 1.6 }}>→ <strong>Pitch angle:</strong> "Here's what your brand looks like in motion — deployment-ready for email, ads, and pitch decks."</p>
              <p style={{ margin: "0 0 10px", fontSize: 14, lineHeight: 1.6 }}>→ <strong>First channel:</strong> Email hero animation — highest ROI, easiest to justify to a client with CTR data.</p>
              <p style={{ margin: "0 0 10px", fontSize: 14, lineHeight: 1.6 }}>→ <strong>Pricing:</strong> Use the Pricing tab for the exact range by deliverable type and your market.</p>
            </div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 20 }}>Market benchmarks only — not financial advice. For precise local pricing: <a href="https://whattheprice.tech" target="_blank" style={{ color: "#000", fontWeight: 700 }}>whattheprice.tech</a></div>
          </>
        ) : (
          <>
            <div style={styles.body_text}>Three buyers who need exactly this:</div>
            <div style={{ marginBottom: 20 }}>
              {[
                { n: "①", buyer: "DTC brand founder", why: "needs deployment-ready social loops for paid ads — no internal motion capability" },
                { n: "②", buyer: "Branding agency (5–50 people)", why: "strong static portfolio, no motion team — ideal white-label partner" },
                { n: "③", buyer: "SaaS startup pre-launch", why: "pitch deck and social presence both need motion brand intro" },
              ].map(b => (
                <div key={b.n} style={{ ...styles.card, marginBottom: 10 }}>
                  <div style={styles.card_title}>{b.n} {b.buyer}</div>
                  <div style={styles.card_sub}>{b.why}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>
              <strong>Fastest path to first paid project:</strong><br />
              Level 1 → <strong>Contra + Dribbble + LinkedIn</strong><br />
              Level 2 → your existing client list<br />
              Level 3 → LinkedIn + cold email (30–50 agency targets)
            </div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 20 }}>Use the Pricing tab for exact ranges by deliverable and market. Not financial advice. <a href="https://whattheprice.tech" target="_blank" style={{ color: "#000", fontWeight: 700 }}>whattheprice.tech</a></div>
          </>
        )}
        <Divider />
        <div style={styles.section_title}>What would you like to do next?</div>
        <ChoiceButton label="How much should I charge for this?" onClick={() => setActiveTab("pricing")} />
        <ChoiceButton label="Try a different animation for this image" onClick={() => { setSelectedIdea(null); setGenerationStatus(null); setIterationIssue(null); setStep(3); }} />
        <ChoiceButton label="Start fresh with a new brand image" onClick={resetAll} />
        <ChoiceButton label="I'm done — thanks" onClick={() => setStep(99)} />
      </div>
    );

    // STEP 6 — Iteration
    if (step === 6) return (
      <div>
        <div style={styles.stepLabel}>Fix the prompt</div>
        <div style={styles.heading}>Let's fix it.</div>
        <div style={styles.section_title}>What's the issue?</div>
        {[
          { key: "camera", label: "Camera movement is wrong" },
          { key: "material", label: "Material or lighting is off" },
          { key: "pacing", label: "Motion pacing is wrong" },
          { key: "brand", label: "The brand element is not reading clearly" },
          { key: "other", label: "Something else — I'll describe it" },
        ].map(o => (
          <ChoiceButton key={o.key} label={o.label} selected={iterationIssue === o.key} onClick={() => setIterationIssue(o.key)} />
        ))}
        {iterationIssue && (
          <>
            <Divider />
            <div style={styles.section_title}>Fix applied</div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: "#333", marginBottom: 16 }}>
              {iterationIssue === "camera" && "Fix: replace the current movement with 'static locked-off, medium close-up' — this gives the model the most stable output for brand assets."}
              {iterationIssue === "material" && "Fix: add 'single hard key light upper-left, specular highlights tracking the key light, dark background, no fill light' to lock the material behavior."}
              {iterationIssue === "pacing" && "Fix: add 'deliberate pace, 6 seconds total, no fast cuts' to the prompt to slow the motion down."}
              {iterationIssue === "brand" && "Fix: add 'logo remains visible and fully legible throughout, center-frame, no obscuring elements' to anchor the brand element."}
              {iterationIssue === "other" && "Describe the issue below — copy the revised prompt with your note appended."}
            </div>
            {iterationIssue !== "other" && (
              <>
                <div style={styles.prompt_box}>{generatedPrompt} [REVISED: {
                  iterationIssue === "camera" ? "static locked-off, medium close-up" :
                  iterationIssue === "material" ? "single hard key light upper-left, specular highlights tracking the key light, dark background, no fill light" :
                  iterationIssue === "pacing" ? "deliberate pace, 6 seconds total, no fast cuts" :
                  "logo remains visible and fully legible throughout, center-frame, no obscuring elements"
                }]</div>
                <CopyButton text={generatedPrompt + " [REVISED: " + (
                  iterationIssue === "camera" ? "static locked-off, medium close-up" :
                  iterationIssue === "material" ? "single hard key light upper-left, specular highlights tracking the key light, dark background, no fill light" :
                  iterationIssue === "pacing" ? "deliberate pace, 6 seconds total, no fast cuts" :
                  "logo remains visible and fully legible throughout, center-frame, no obscuring elements"
                ) + "]"} />
              </>
            )}
            {iterationIssue === "other" && (
              <>
                <textarea
                  style={{ ...styles.textarea, marginBottom: 12 }}
                  placeholder="Describe what went wrong in one sentence..."
                  value={otherIssueText}
                  onChange={e => setOtherIssueText(e.target.value)}
                />
                {otherIssueText.trim().length > 10 && (
                  <>
                    <div style={styles.prompt_box}>{generatedPrompt} [USER NOTE: {otherIssueText.trim()}]</div>
                    <CopyButton text={generatedPrompt + " [USER NOTE: " + otherIssueText.trim() + "]"} />
                    <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>Paste this revised prompt into Seedance. The note guides the model on what to adjust.</div>
                  </>
                )}
              </>
            )}
            <Divider />
            <div style={styles.section_title}>How did the revised generation go?</div>
            <ChoiceButton label="It worked great — what do I do with it now?" onClick={() => { setStep(5); }} />
            <ChoiceButton label="Still something off — try again" onClick={() => setIterationIssue(null)} />
          </>
        )}
      </div>
    );

    if (step === 99) return (
      <div>
        <div style={styles.heading}>Good work today.</div>
        <div style={styles.body_text}>When you're ready to go again, upload a new image.</div>
        <PrimaryBtn label="Start over" onClick={resetAll} />
      </div>
    );
  };

  // ── PRICING TAB ────────────────────────────────────────────────
  const renderPricing = () => {
    const selected = pricingDeliverable ? PRICING[pricingDeliverable] : null;
    const regionObj = pricingRegion ? REGIONAL.find(r => r.label === pricingRegion) : null;
    return (
      <div>
        <div style={styles.stepLabel}>Pricing Calculator</div>
        <div style={styles.heading}>What are you delivering?</div>
        {Object.entries(PRICING).map(([k, v]) => (
          <ChoiceButton key={k} label={v.label} sublabel={v.range} selected={pricingDeliverable === k} onClick={() => setPricingDeliverable(k)} />
        ))}
        {pricingDeliverable && (
          <>
            <Divider />
            <div style={styles.section_title}>Your market</div>
            {REGIONAL.map(r => (
              <ChoiceButton key={r.label} label={r.label} sublabel={`${r.coeff}${r.note ? " — " + r.note : ""}`} selected={pricingRegion === r.label} onClick={() => setPricingRegion(r.label)} />
            ))}
          </>
        )}
        {selected && pricingRegion && (
          <>
            <Divider />
            <div style={styles.section_title}>Your price range</div>
            <div style={styles.price_big}>{selected.range}</div>
            <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>{selected.label}</div>
            {regionObj && regionObj.coeff !== "1.0×" && (
              <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>Apply {regionObj.coeff} coefficient for {pricingRegion}</div>
            )}
            <div style={{ marginTop: 8, marginBottom: 16 }}>
              <Tag text="Level 1" /><Tag text="Level 2" /><Tag text="Level 3" />
            </div>
            <div style={{ fontSize: 13, color: "#555", lineHeight: 1.7, padding: "12px 14px", background: "#f7f7f7", borderRadius: 8, marginBottom: 16 }}>
              <strong>Frame this as a system, not a one-off.</strong><br />
              Add static fallbacks + multiple ratios and $900–1,500 is easily defensible for the same session.
            </div>
            <div style={styles.note}>Market benchmarks only — not financial advice. Adjust for your market and client.<br />For precise local pricing: <a href="https://whattheprice.tech" target="_blank" style={styles.link}>whattheprice.tech</a></div>
          </>
        )}
        <Divider />
        <div style={styles.section_title}>Day rate anchors</div>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          Mid-to-senior custom work: <strong>$500–900/day</strong><br />
          Agency retainer (part-time): <strong>$2,000–5,000/month</strong><br />
          Agency retainer (dedicated): <strong>$4,000–7,000/month</strong><br />
          Floor: <strong>Never below $350–400</strong> for any custom animated asset.
        </div>
      </div>
    );
  };

  // ── CHANNELS TAB ───────────────────────────────────────────────
  const renderChannels = () => (
    <div>
      <div style={styles.stepLabel}>Where to Sell</div>
      <div style={styles.heading}>Channels & Buyers.</div>
      {CHANNELS.map(ch => (
        <div key={ch.level} style={{ ...styles.card, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Tag text={ch.level} />
            <span style={styles.card_title}>{ch.title}</span>
          </div>
          <div style={{ fontSize: 13, color: "#444", lineHeight: 1.6, marginBottom: 10 }}>
            <strong>Who buys:</strong> {ch.buyers.join(" · ")}
          </div>
          <div style={{ fontSize: 13, color: "#444", lineHeight: 1.6, marginBottom: 10 }}>
            <strong>Platforms:</strong> {ch.platforms.join(" · ")}
          </div>
          <div style={{ fontSize: 12, color: "#777", lineHeight: 1.5 }}>{ch.note}</div>
        </div>
      ))}
      <Divider />
      <div style={styles.section_title}>Cold email structure (Level 3)</div>
      {[
        ["Line 1", "Specific compliment", "Loved your [Client] rebrand — static system is super tight."],
        ["Line 2", "Gap + opportunity", "Noticed the launch assets were mostly static — a motion layer usually lifts ad performance."],
        ["Line 3", "Your position", "I'm a motion-driven brand director working white-label with studios on logo reveals, hero animations, and social loops."],
        ["Line 4", "Low-friction offer", "I can send a one-page motion add-ons menu you can plug into proposals."],
        ["Line 5", "CTA", "Worth a 15-minute call next week?"],
      ].map(([label, desc, ex]) => (
        <div key={label} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#999", marginBottom: 2 }}>{label} — {desc}</div>
          <div style={{ fontSize: 13, color: "#333", padding: "8px 12px", background: "#f7f7f7", borderRadius: 6, fontStyle: "italic" }}>"{ex}"</div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={styles.wrap}>
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap" rel="stylesheet" />
      <div style={styles.header}>
        <div style={styles.logoWrap}>
          <div style={{ width: 28, height: 28 }} dangerouslySetInnerHTML={{ __html: OPENART_LOGO }} />
          <div>
            <div style={styles.logoText}>Motion Brief</div>
            <div style={styles.poweredBy}>Powered by OpenArt</div>
          </div>
        </div>
        <a href="https://amirmushich.link/SD2" target="_blank" style={{ fontSize: 12, fontWeight: 700, color: "#000", textDecoration: "none", border: "1.5px solid #000", padding: "5px 12px", borderRadius: 20 }}>Try Seedance 2.0 →</a>
      </div>
      <div style={styles.tabBar}>
        {[["assistant", "Prompt Builder"], ["pricing", "Pricing"], ["channels", "Channels & Buyers"]].map(([key, label]) => (
          <button key={key} style={styles.tab(activeTab === key)} onClick={() => setActiveTab(key)}>{label}</button>
        ))}
      </div>
      <div style={styles.body}>
        {activeTab === "assistant" && renderAssistant()}
        {activeTab === "pricing" && renderPricing()}
        {activeTab === "channels" && renderChannels()}
        <div ref={bottomRef} />
      </div>
      <div style={{ borderTop: "1px solid #e8e8e8", padding: "16px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#aaa", letterSpacing: "0.02em" }}>
          Built by <a href="https://x.com/AmirMushich" target="_blank" style={{ color: "#000", fontWeight: 700, textDecoration: "none" }}>@AmirMushich</a> · Powered by <a href="https://openart.ai" target="_blank" style={{ color: "#000", fontWeight: 700, textDecoration: "none" }}>OpenArt</a>
        </div>
      </div>
    </div>
  );
}
