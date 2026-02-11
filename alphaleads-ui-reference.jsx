import { useState } from "react";

const colors = {
  navy: { 900: "#1a2636", 800: "#2D4059", 700: "#3a5275", 600: "#4a6a91", 100: "#e8ecf1", 50: "#f3f5f8" },
  coral: { 700: "#d43d3e", 600: "#EA5455", 500: "#ee7273", 100: "#fde8e8", 50: "#fef5f5" },
  orange: { 700: "#d86a2f", 600: "#F07B3F", 500: "#f49565", 100: "#fdeee4", 50: "#fef7f3" },
  gold: { 700: "#e6b82e", 600: "#FFD460", 500: "#ffe08a", 100: "#fff8e0", 50: "#fffcf0" },
  neutral: { 900: "#111827", 800: "#1f2937", 700: "#374151", 600: "#4b5563", 500: "#6b7280", 400: "#9ca3af", 300: "#d1d5db", 200: "#e5e7eb", 100: "#f3f4f6", 50: "#f9fafb", white: "#ffffff" },
};

const Badge = ({ children, variant = "success" }) => {
  const styles = {
    success: { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" },
    warning: { background: colors.gold[100], color: "#92400e", border: `1px solid ${colors.gold[500]}` },
    error: { background: colors.coral[100], color: colors.coral[700], border: `1px solid ${colors.coral[500]}` },
    info: { background: colors.navy[100], color: colors.navy[800], border: `1px solid ${colors.navy[700]}` },
  };
  return (
    <span style={{ ...styles[variant], padding: "2px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.02em" }}>
      {children}
    </span>
  );
};

const SidebarItem = ({ icon, label, active = false }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", borderRadius: "8px", cursor: "pointer",
    background: active ? "rgba(240,123,63,0.15)" : "transparent",
    color: active ? colors.orange[600] : "rgba(255,255,255,0.65)",
    fontWeight: active ? 600 : 400, fontSize: "14px", transition: "all 0.2s",
  }}>
    <span style={{ fontSize: "18px" }}>{icon}</span>
    <span>{label}</span>
    {active && <div style={{ marginLeft: "auto", width: "6px", height: "6px", borderRadius: "50%", background: colors.orange[600] }} />}
  </div>
);

const StatCard = ({ icon, label, value, trend }) => (
  <div style={{
    background: colors.neutral.white, borderRadius: "12px", padding: "20px 24px",
    border: `1px solid ${colors.neutral[200]}`, flex: 1,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: colors.navy[100], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
        {icon}
      </div>
      {trend && <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>{trend}</span>}
    </div>
    <div style={{ fontSize: "28px", fontWeight: 700, color: colors.navy[800], letterSpacing: "-0.02em" }}>{value}</div>
    <div style={{ fontSize: "13px", color: colors.neutral[500], marginTop: "4px" }}>{label}</div>
  </div>
);

const SearchRow = ({ name, date, leads, status }) => {
  const statusMap = { completed: "success", running: "warning", failed: "error" };
  const statusLabel = { completed: "Completata", running: "In corso", failed: "Fallita" };
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 60px", alignItems: "center",
      padding: "14px 20px", borderBottom: `1px solid ${colors.neutral[100]}`, fontSize: "14px",
    }}>
      <span style={{ fontWeight: 500, color: colors.navy[800] }}>{name}</span>
      <span style={{ color: colors.neutral[500] }}>{date}</span>
      <span style={{ color: colors.neutral[700], fontWeight: 500 }}>{leads}</span>
      <Badge variant={statusMap[status]}>{statusLabel[status]}</Badge>
      <span style={{ color: colors.neutral[400], cursor: "pointer", textAlign: "right" }}>→</span>
    </div>
  );
};

const TagInput = ({ tags = [], placeholder }) => (
  <div style={{
    display: "flex", flexWrap: "wrap", gap: "6px", padding: "8px 12px", borderRadius: "8px",
    border: `1px solid ${colors.neutral[300]}`, background: colors.neutral.white, minHeight: "42px", alignItems: "center",
  }}>
    {tags.map((t, i) => (
      <span key={i} style={{
        display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px",
        background: colors.navy[100], borderRadius: "6px", fontSize: "13px", fontWeight: 500, color: colors.navy[800],
      }}>
        {t}
        <span style={{ cursor: "pointer", color: colors.neutral[400], fontSize: "14px", lineHeight: 1 }}>×</span>
      </span>
    ))}
    <span style={{ color: colors.neutral[400], fontSize: "13px" }}>{tags.length === 0 ? placeholder : ""}</span>
  </div>
);

const CheckboxGroup = ({ options = [], selected = [] }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
    {options.map((opt) => {
      const isSelected = selected.includes(opt);
      return (
        <div key={opt} style={{
          padding: "6px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
          border: `1.5px solid ${isSelected ? colors.orange[600] : colors.neutral[300]}`,
          background: isSelected ? colors.orange[50] : colors.neutral.white,
          color: isSelected ? colors.orange[700] : colors.neutral[600],
          transition: "all 0.15s",
        }}>
          {opt}
        </div>
      );
    })}
  </div>
);

const LeadRow = ({ name, title, email, phone, company, industry, location, revenue, size }) => (
  <div style={{
    display: "grid", gridTemplateColumns: "20px 1.5fr 1.2fr 1.5fr 1fr 1.2fr 1fr 1fr 0.8fr 0.8fr",
    alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${colors.neutral[100]}`, fontSize: "13px",
  }}>
    <input type="checkbox" style={{ accentColor: colors.orange[600] }} />
    <div>
      <div style={{ fontWeight: 600, color: colors.navy[800] }}>{name}</div>
    </div>
    <span style={{ color: colors.neutral[600] }}>{title}</span>
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ color: colors.neutral[700], fontFamily: "monospace", fontSize: "12px" }}>{email}</span>
      <span style={{ color: colors.neutral[400], cursor: "pointer", fontSize: "11px" }}>📋</span>
    </div>
    <span style={{ color: colors.neutral[600] }}>{phone || "—"}</span>
    <span style={{ fontWeight: 500, color: colors.navy[700] }}>{company}</span>
    <span style={{ color: colors.neutral[500] }}>{industry}</span>
    <span style={{ color: colors.neutral[500] }}>{location}</span>
    <span style={{ color: colors.neutral[600] }}>{revenue}</span>
    <span style={{ color: colors.neutral[500] }}>{size}</span>
  </div>
);

export default function AlphaleadsUI() {
  const [activeView, setActiveView] = useState("dashboard");

  return (
    <div style={{ fontFamily: "'DM Sans', 'Inter', sans-serif", background: colors.neutral[50], minHeight: "100vh", display: "flex", color: colors.neutral[700] }}>
      {/* ── SIDEBAR ── */}
      <aside style={{
        width: "260px", background: colors.navy[800], padding: "24px 16px", display: "flex", flexDirection: "column",
        borderRight: "none", flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 16px 28px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: "24px" }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "8px",
            background: `linear-gradient(135deg, ${colors.orange[600]}, ${colors.gold[600]})`,
            display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "16px",
          }}>α</div>
          <span style={{ color: "white", fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em" }}>Alphaleads</span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          <SidebarItem icon="🏠" label="Dashboard" active={activeView === "dashboard"} />
          <SidebarItem icon="🔍" label="Nuova Ricerca" active={activeView === "search"} />
          <SidebarItem icon="📋" label="Le tue Ricerche" active={activeView === "history"} />
          <SidebarItem icon="📌" label="Templates" active={activeView === "templates"} />
          <div style={{ flex: 1 }} />
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px" }}>
            <SidebarItem icon="⚙️" label="Impostazioni" />
          </div>
        </nav>

        {/* User */}
        <div style={{
          display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", marginTop: "8px",
          background: "rgba(255,255,255,0.05)", borderRadius: "10px",
        }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            background: `linear-gradient(135deg, ${colors.orange[500]}, ${colors.gold[600]})`,
            display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "13px",
          }}>G</div>
          <div>
            <div style={{ color: "white", fontSize: "13px", fontWeight: 600 }}>Giuseppe</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>Pro Plan</div>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, overflow: "auto" }}>
        {/* ═══════════ DASHBOARD VIEW ═══════════ */}
        {activeView === "dashboard" && (
          <div style={{ padding: "32px 40px", maxWidth: "1200px" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
              <div>
                <h1 style={{ fontSize: "26px", fontWeight: 700, color: colors.navy[800], margin: 0, letterSpacing: "-0.02em" }}>Dashboard</h1>
                <p style={{ color: colors.neutral[500], margin: "4px 0 0", fontSize: "14px" }}>Ciao, Giuseppe. Ecco un riepilogo della tua attività.</p>
              </div>
              <button
                onClick={() => setActiveView("search")}
                style={{
                  background: `linear-gradient(135deg, ${colors.orange[600]}, ${colors.orange[700]})`,
                  color: "white", border: "none", padding: "11px 24px", borderRadius: "10px", fontWeight: 600,
                  fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                  boxShadow: `0 2px 12px ${colors.orange[600]}40`,
                }}>
                <span style={{ fontSize: "16px" }}>+</span> Nuova Ricerca
              </button>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: "20px", marginBottom: "36px" }}>
              <StatCard icon="🔍" label="Ricerche totali" value="47" trend="+12 questo mese" />
              <StatCard icon="👤" label="Lead estratte" value="23.841" trend="+3.200 questo mese" />
              <StatCard icon="✉️" label="Email verificate" value="18.205" />
              <StatCard icon="🕐" label="Ultima ricerca" value="2h fa" />
            </div>

            {/* Recent Searches */}
            <div style={{
              background: colors.neutral.white, borderRadius: "12px", border: `1px solid ${colors.neutral[200]}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden",
            }}>
              <div style={{ padding: "18px 20px", borderBottom: `1px solid ${colors.neutral[200]}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 600, color: colors.navy[800], margin: 0 }}>Ricerche Recenti</h2>
                <span
                  onClick={() => setActiveView("history")}
                  style={{ color: colors.orange[600], fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  Vedi tutte →
                </span>
              </div>
              {/* Table header */}
              <div style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 60px",
                padding: "10px 20px", background: colors.neutral[50], fontSize: "12px", fontWeight: 600,
                color: colors.neutral[500], textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                <span>Nome</span><span>Data</span><span>Lead</span><span>Stato</span><span />
              </div>
              <SearchRow name="CMO SaaS USA" date="06/02/2026" leads="2.340" status="completed" />
              <SearchRow name="CTO UK Series A-C" date="05/02/2026" leads="1.205" status="completed" />
              <SearchRow name="VP Sales DACH Region" date="05/02/2026" leads="—" status="running" />
              <SearchRow name="HR Directors Italy" date="04/02/2026" leads="876" status="completed" />
              <SearchRow name="Founders Fintech EMEA" date="03/02/2026" leads="0" status="failed" />
            </div>
          </div>
        )}

        {/* ═══════════ SEARCH FORM VIEW ═══════════ */}
        {activeView === "search" && (
          <div style={{ padding: "32px 40px", maxWidth: "900px" }}>
            <div style={{ marginBottom: "32px" }}>
              <h1 style={{ fontSize: "26px", fontWeight: 700, color: colors.navy[800], margin: 0, letterSpacing: "-0.02em" }}>Nuova Ricerca</h1>
              <p style={{ color: colors.neutral[500], margin: "4px 0 0", fontSize: "14px" }}>Configura i filtri per trovare le lead più rilevanti per il tuo business.</p>
            </div>

            {/* Section: Configurazione Base */}
            <div style={{ background: colors.neutral.white, borderRadius: "12px", border: `1px solid ${colors.neutral[200]}`, padding: "24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: colors.navy[800], margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "24px", height: "24px", borderRadius: "6px", background: colors.navy[100], display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>1</span>
                Configurazione Base
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: colors.neutral[600], marginBottom: "6px", display: "block" }}>Nome Ricerca</label>
                  <input placeholder="Es: CMO SaaS USA" style={{
                    width: "100%", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${colors.neutral[300]}`,
                    fontSize: "14px", outline: "none", boxSizing: "border-box",
                  }} />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: colors.neutral[600], marginBottom: "6px", display: "block" }}>Numero di Lead</label>
                  <input type="number" defaultValue={25} style={{
                    width: "100%", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${colors.neutral[300]}`,
                    fontSize: "14px", outline: "none", boxSizing: "border-box",
                  }} />
                </div>
              </div>
            </div>

            {/* Section: Targeting Persona */}
            <div style={{ background: colors.neutral.white, borderRadius: "12px", border: `1px solid ${colors.neutral[200]}`, padding: "24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: colors.navy[800], margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "24px", height: "24px", borderRadius: "6px", background: colors.navy[100], display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>2</span>
                Targeting Persona
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: colors.neutral[600], marginBottom: "6px", display: "block" }}>Job Title — Includi</label>
                  <TagInput tags={["CMO", "Head of Marketing", "VP Marketing"]} placeholder="Scrivi e premi Enter per aggiungere..." />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: colors.neutral[600], marginBottom: "6px", display: "block" }}>Job Title — Escludi</label>
                  <TagInput tags={["Intern"]} placeholder="Scrivi e premi Enter per aggiungere..." />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: colors.neutral[600], marginBottom: "6px", display: "block" }}>Livello Seniority</label>
                  <CheckboxGroup
                    options={["Founder", "Owner", "C-Level", "Director", "VP", "Head", "Manager", "Senior", "Entry", "Trainee"]}
                    selected={["C-Level", "VP", "Head"]}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: colors.neutral[600], marginBottom: "6px", display: "block" }}>Livello Funzionale</label>
                  <CheckboxGroup
                    options={["C-Level", "Finance", "Product", "Engineering", "Design", "HR", "IT", "Legal", "Marketing", "Operations", "Sales", "Support"]}
                    selected={["Marketing"]}
                  />
                </div>
              </div>
            </div>

            {/* Section: Localizzazione */}
            <div style={{ background: colors.neutral.white, borderRadius: "12px", border: `1px solid ${colors.neutral[200]}`, padding: "24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: colors.navy[800], margin: "0 0 8px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "24px", height: "24px", borderRadius: "6px", background: colors.navy[100], display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>3</span>
                Localizzazione
              </h3>
              <div style={{
                background: colors.gold[50], border: `1px solid ${colors.gold[500]}`, borderRadius: "8px",
                padding: "10px 14px", fontSize: "13px", color: "#92400e", marginBottom: "16px", lineHeight: 1.5,
              }}>
                💡 Usa "Location" per regione/paese/stato (es: United States, EMEA). Usa "Città" per una città specifica. Non combinare entrambi per lo stesso target.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: colors.neutral[600], marginBottom: "6px", display: "block" }}>Location — Includi</label>
                  <TagInput tags={["United States"]} placeholder="Regione, paese o stato..." />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: colors.neutral[600], marginBottom: "6px", display: "block" }}>Città — Includi</label>
                  <TagInput tags={[]} placeholder="Città specifica..." />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: colors.neutral[600], marginBottom: "6px", display: "block" }}>Location — Escludi</label>
                  <TagInput tags={[]} placeholder="Regioni da escludere..." />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: colors.neutral[600], marginBottom: "6px", display: "block" }}>Città — Escludi</label>
                  <TagInput tags={[]} placeholder="Città da escludere..." />
                </div>
              </div>
            </div>

            {/* Section: Email Quality */}
            <div style={{ background: colors.neutral.white, borderRadius: "12px", border: `1px solid ${colors.neutral[200]}`, padding: "24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: colors.navy[800], margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "24px", height: "24px", borderRadius: "6px", background: colors.navy[100], display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>4</span>
                Qualità Email
              </h3>
              <CheckboxGroup options={["Validated", "Not Validated", "Unknown"]} selected={["Validated"]} />
              <p style={{ fontSize: "12px", color: colors.neutral[500], margin: "10px 0 0" }}>Seleziona solo "Validated" per liste pronte all'outreach. Aggiungi "Unknown" per aumentare il volume.</p>
            </div>

            {/* Section: Company */}
            <div style={{ background: colors.neutral.white, borderRadius: "12px", border: `1px solid ${colors.neutral[200]}`, padding: "24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: colors.navy[800], margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "24px", height: "24px", borderRadius: "6px", background: colors.navy[100], display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>5</span>
                Targeting Azienda
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: colors.neutral[600], marginBottom: "6px", display: "block" }}>Industry — Includi</label>
                  <TagInput tags={["Computer Software", "SaaS", "Marketing & Advertising"]} placeholder="Settori..." />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: colors.neutral[600], marginBottom: "6px", display: "block" }}>Dimensione Azienda</label>
                  <CheckboxGroup
                    options={["0-1", "2-10", "11-20", "21-50", "51-100", "101-200", "201-500", "501-1000", "1001-2000", "2001-5000", "10000+"]}
                    selected={["51-100", "101-200", "201-500"]}
                  />
                </div>
              </div>
            </div>

            {/* Section: Financial */}
            <div style={{ background: colors.neutral.white, borderRadius: "12px", border: `1px solid ${colors.neutral[200]}`, padding: "24px", marginBottom: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: colors.navy[800], margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "24px", height: "24px", borderRadius: "6px", background: colors.navy[100], display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>6</span>
                Dati Finanziari
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: colors.neutral[600], marginBottom: "6px", display: "block" }}>Revenue Minima</label>
                  <select style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${colors.neutral[300]}`, fontSize: "14px", background: "white" }}>
                    <option>Seleziona...</option>
                    <option>100K</option><option>500K</option><option>1M</option><option>5M</option><option>10M</option>
                    <option>25M</option><option>50M</option><option>100M</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: colors.neutral[600], marginBottom: "6px", display: "block" }}>Revenue Massima</label>
                  <select style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${colors.neutral[300]}`, fontSize: "14px", background: "white" }}>
                    <option>Seleziona...</option>
                    <option>1M</option><option>5M</option><option>10M</option><option>50M</option>
                    <option>100M</option><option>500M</option><option>1B</option><option>10B</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: colors.neutral[600], marginBottom: "6px", display: "block" }}>Tipo di Funding</label>
                <CheckboxGroup
                  options={["Seed", "Angel", "Series A", "Series B", "Series C", "Venture", "Private Equity"]}
                  selected={["Series A", "Series B"]}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", paddingBottom: "40px" }}>
              <button style={{
                background: "transparent", border: `1.5px solid ${colors.neutral[300]}`, padding: "11px 20px",
                borderRadius: "10px", fontWeight: 600, fontSize: "14px", cursor: "pointer", color: colors.neutral[600],
              }}>
                Reset Filtri
              </button>
              <button style={{
                background: "transparent", border: `1.5px solid ${colors.navy[700]}`, padding: "11px 20px",
                borderRadius: "10px", fontWeight: 600, fontSize: "14px", cursor: "pointer", color: colors.navy[800],
              }}>
                📌 Salva come Template
              </button>
              <button style={{
                background: `linear-gradient(135deg, ${colors.orange[600]}, ${colors.orange[700]})`,
                color: "white", border: "none", padding: "11px 28px", borderRadius: "10px", fontWeight: 600,
                fontSize: "14px", cursor: "pointer",
                boxShadow: `0 2px 12px ${colors.orange[600]}40`,
              }}>
                🔍 Avvia Ricerca
              </button>
            </div>
          </div>
        )}

        {/* ═══════════ RESULTS VIEW ═══════════ */}
        {activeView === "history" && (
          <div style={{ padding: "32px 40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div>
                <h1 style={{ fontSize: "26px", fontWeight: 700, color: colors.navy[800], margin: 0, letterSpacing: "-0.02em" }}>CMO SaaS USA</h1>
                <p style={{ color: colors.neutral[500], margin: "4px 0 0", fontSize: "14px" }}>06/02/2026 · 2.340 lead trovate</p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button style={{
                  background: "transparent", border: `1.5px solid ${colors.neutral[300]}`, padding: "9px 16px",
                  borderRadius: "8px", fontWeight: 600, fontSize: "13px", cursor: "pointer", color: colors.neutral[600],
                }}>
                  📧 Copia Email
                </button>
                <button style={{
                  background: "transparent", border: `1.5px solid ${colors.neutral[300]}`, padding: "9px 16px",
                  borderRadius: "8px", fontWeight: 600, fontSize: "13px", cursor: "pointer", color: colors.neutral[600],
                }}>
                  📊 Esporta Excel
                </button>
                <button style={{
                  background: `linear-gradient(135deg, ${colors.orange[600]}, ${colors.orange[700]})`,
                  color: "white", border: "none", padding: "9px 16px", borderRadius: "8px", fontWeight: 600,
                  fontSize: "13px", cursor: "pointer",
                }}>
                  📥 Esporta CSV
                </button>
              </div>
            </div>

            {/* Filter summary chips */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
              {["Job: CMO, Head of Marketing, VP Marketing", "Location: United States", "Industry: SaaS, Computer Software", "Seniority: C-Level, VP, Head", "Email: Validated"].map((f, i) => (
                <span key={i} style={{
                  padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 500,
                  background: colors.navy[100], color: colors.navy[700],
                }}>{f}</span>
              ))}
            </div>

            {/* Search bar */}
            <div style={{
              display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px",
            }}>
              <input placeholder="Cerca per nome, email, azienda..." style={{
                flex: 1, padding: "10px 14px", borderRadius: "8px", border: `1px solid ${colors.neutral[300]}`,
                fontSize: "14px", outline: "none",
              }} />
              <span style={{ color: colors.neutral[500], fontSize: "13px", whiteSpace: "nowrap" }}>Mostrando 25 di 2.340 lead</span>
            </div>

            {/* Results Table */}
            <div style={{
              background: colors.neutral.white, borderRadius: "12px", border: `1px solid ${colors.neutral[200]}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden",
            }}>
              {/* Header */}
              <div style={{
                display: "grid", gridTemplateColumns: "20px 1.5fr 1.2fr 1.5fr 1fr 1.2fr 1fr 1fr 0.8fr 0.8fr",
                padding: "10px 16px", background: colors.neutral[50], fontSize: "11px", fontWeight: 700,
                color: colors.neutral[500], textTransform: "uppercase", letterSpacing: "0.06em",
                borderBottom: `1px solid ${colors.neutral[200]}`,
              }}>
                <input type="checkbox" style={{ accentColor: colors.orange[600] }} />
                <span>Nome</span><span>Job Title</span><span>Email</span><span>Telefono</span>
                <span>Azienda</span><span>Industry</span><span>Location</span><span>Revenue</span><span>Size</span>
              </div>
              <LeadRow name="Sarah Chen" title="CMO" email="s.chen@hubspot.com" phone="+1 617-xxx" company="HubSpot" industry="SaaS" location="Boston, US" revenue="$1.7B" size="5001-10000" />
              <LeadRow name="James Miller" title="VP Marketing" email="j.miller@stripe.com" phone="+1 415-xxx" company="Stripe" industry="Fintech" location="SF, US" revenue="$14B" size="5001-10000" />
              <LeadRow name="Maria Garcia" title="Head of Marketing" email="m.garcia@notion.so" company="Notion" industry="SaaS" location="NYC, US" revenue="$100M" size="501-1000" />
              <LeadRow name="Alex Johnson" title="CMO" email="a.johnson@figma.com" phone="+1 628-xxx" company="Figma" industry="Software" location="SF, US" revenue="$500M" size="1001-2000" />
              <LeadRow name="Emily Davis" title="VP Marketing" email="e.davis@airtable.com" company="Airtable" industry="SaaS" location="SF, US" revenue="$250M" size="501-1000" />
            </div>

            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", marginTop: "20px" }}>
              {["←", "1", "2", "3", "...", "94", "→"].map((p, i) => (
                <span key={i} style={{
                  padding: "7px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: p === "1" ? 700 : 500,
                  cursor: "pointer",
                  background: p === "1" ? colors.orange[600] : "transparent",
                  color: p === "1" ? "white" : colors.neutral[600],
                  border: p === "1" ? "none" : `1px solid ${colors.neutral[200]}`,
                }}>{p}</span>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Nav switcher for preview */}
      <div style={{
        position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)",
        display: "flex", gap: "6px", padding: "6px", background: colors.navy[800],
        borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
      }}>
        {[
          { id: "dashboard", label: "Dashboard" },
          { id: "search", label: "Form Ricerca" },
          { id: "history", label: "Risultati" },
        ].map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id)} style={{
            padding: "8px 18px", borderRadius: "8px", border: "none", fontWeight: 600, fontSize: "13px",
            cursor: "pointer", transition: "all 0.2s",
            background: activeView === v.id ? colors.orange[600] : "transparent",
            color: activeView === v.id ? "white" : "rgba(255,255,255,0.6)",
          }}>{v.label}</button>
        ))}
      </div>
    </div>
  );
}
