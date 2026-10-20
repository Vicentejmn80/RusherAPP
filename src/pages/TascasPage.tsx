import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, MapPin, MessageCircle } from "lucide-react";
import { instagramLink, mapsLink, whatsappLink } from "@/lib/allyContact";
import { TabBar } from "@/components/ui/TabBar";
import { cyclePeriodLabel, pickActiveCycle } from "@/lib/toboHome";
import { listCycles, listTascas, type Tasca, type ToboCycle } from "@/services/matchesApi";
import { LVBP_EXPERIENCE_TITLE, LVBP_SEASON_LABEL, LVBP_VENUES_TAB_LABEL } from "@/config/lvbpBrand";
import { TOBO_ROUND_PRIZE_SUBTITLE } from "@/config/tobo";

function venueInitials(name: string) {
  const skip = new Set(["de", "del", "la", "las", "los", "el", "y"]);
  const words = name.split(/\s+/).filter((part) => part && !skip.has(part.toLowerCase()));
  const source = words.length > 0 ? words : name.split(/\s+/).filter(Boolean);
  return source.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "A";
}

function VenueCard({ tasca, onView }: { tasca: Tasca; onView: () => void }) {
  const instagram = instagramLink(tasca.instagram || "");
  const whatsapp = whatsappLink(tasca.whatsapp || "");
  const mapsUrl = mapsLink(tasca.mapsUrl || "") || (tasca.lat && tasca.lng ? `https://www.google.com/maps/search/?api=1&query=${tasca.lat},${tasca.lng}` : "");
  const category = tasca.category || tasca.highlights?.find((item) => item.title)?.title || "";
  const benefit = tasca.roundPrize && tasca.roundPrize !== "Por confirmar" ? tasca.roundPrize : "";
  const address = tasca.address && tasca.address !== "Por confirmar" ? tasca.address : "";

  return (
    <article
      className="venue-card-in rounded-[20px] shadow-[0_10px_24px_rgba(0,0,0,0.28)]"
      style={{ backgroundColor: "var(--t-card)", border: "1px solid var(--t-border)" }}
    >
      <div
        className="flex min-w-0 flex-col items-center rounded-t-[20px] bg-[#000000] px-4 py-6"
        style={{ borderBottom: "0.5px solid #3a3320" }}
      >
        <div className="relative flex w-full min-w-0 items-center justify-center">
          <span aria-hidden="true" className="pointer-events-none absolute left-0 top-1/2 h-px w-8 -translate-y-1/2 bg-[#DDB04A]/50" />
          <span aria-hidden="true" className="pointer-events-none absolute right-0 top-1/2 h-px w-8 -translate-y-1/2 bg-[#DDB04A]/50" />
          {tasca.logoUrl ? (
            <img
              src={tasca.logoUrl}
              alt=""
              className="relative block h-[150px] w-auto min-w-0 max-w-[85%] shrink object-contain sm:h-[180px]"
            />
          ) : (
            <span className="relative flex h-[150px] items-center justify-center text-[28px] font-medium text-white sm:h-[180px]">
              {venueInitials(tasca.name)}
            </span>
          )}
        </div>
        <h3 className="mt-2 max-w-full text-center text-[15px] font-medium leading-tight text-white">{tasca.name}</h3>
        {category ? <p className="mt-0.5 text-center text-[11px] font-medium text-[#9aa4ad]">{category}</p> : null}
        <span className="mt-2 rounded-[99px] bg-[#b8f53a] px-2 py-0.5 text-[11px] font-medium text-[#0b0f13]">Aliado oficial</span>
      </div>

      <div className="px-4 pb-4 pt-4 sm:px-6 lg:px-8">
        {benefit ? (
          <div className="mb-3 rounded-[8px] px-4 py-3" style={{ backgroundColor: "#16241a", border: "0.5px solid #2c4a2c" }}>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#b8f53a]">Beneficio</p>
            <p className="mt-0.5 text-[16px] font-extrabold text-[#d7dde2]">{benefit}</p>
            <p className="mt-1 text-[12px] font-bold text-[#d7dde2]">Escanea el QR en el local en tu primera visita para activar tu beneficio.</p>
          </div>
        ) : null}
        {address ? <p className="mb-3 text-[11px] font-medium text-[#9aa4ad]">{address.split(", ").join(" · ")}</p> : null}

        <div className="grid grid-cols-2 gap-2">
          {instagram ? <a href={instagram} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-1.5 rounded-[14px] text-[13px] font-extrabold" style={{ backgroundColor: "var(--t-bg)", border: "1px solid var(--t-border)" }}><Camera className="h-4 w-4" /> Instagram</a> : null}
          {whatsapp ? <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-1.5 rounded-[14px] text-[13px] font-extrabold" style={{ backgroundColor: "var(--t-bg)", border: "1px solid var(--t-border)" }}><MessageCircle className="h-4 w-4" /> WhatsApp</a> : null}
          {mapsUrl ? <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-1.5 rounded-[14px] text-[13px] font-extrabold" style={{ backgroundColor: "var(--t-bg)", border: "1px solid var(--t-border)" }}><MapPin className="h-4 w-4" /> Cómo llegar</a> : null}
        </div>
        <button type="button" onClick={onView} className="mt-2 flex h-11 w-full items-center justify-center rounded-[14px] bg-[#C6FF3D] px-2 text-[13px] font-extrabold text-[#0B0D0F]">Escanear QR en el local</button>
      </div>
    </article>
  );
}

export function TascasPage() {
  const navigate = useNavigate();
  const [tascas, setTascas] = useState<Tasca[]>([]);
  const [cycles, setCycles] = useState<ToboCycle[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([listTascas(), listCycles()])
      .then(([tascaRows, cycleRows]) => {
        if (alive) {
          setTascas(tascaRows);
          setCycles(cycleRows);
        }
      })
      .catch((reason: unknown) => {
        if (alive) setError(reason instanceof Error ? reason.message : "No se pudieron cargar las tascas.");
      });
    return () => { alive = false; };
  }, []);

  const active = pickActiveCycle(cycles);
  const activeTascas = tascas.filter((t) => t.active !== false);
  const withPrize = activeTascas.filter((t) => t.roundPrize && t.roundPrize !== "Por confirmar");

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.14em]" style={{ color: "var(--t-accent)" }}>
          {LVBP_EXPERIENCE_TITLE}
        </p>
        <h2 className="text-[26px] font-extrabold tracking-tight">Locales aliados</h2>
        <p className="text-[13px] font-semibold" style={{ color: "var(--t-muted)" }}>
          Descubre los negocios participantes, sus beneficios y escanea el QR cuando los visites.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-[calc(24px+env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
        {error && (
          <p className="mb-3 rounded-2xl px-4 py-3 text-[13px] font-bold text-[#E23B2F]" style={{ backgroundColor: "var(--t-card)" }}>
            {error}
          </p>
        )}

        {/* Section label */}
        <p
          className="mb-3 px-1 text-[12px] font-extrabold uppercase tracking-[0.14em]"
          style={{ color: "var(--t-muted)" }}
        >
          {LVBP_VENUES_TAB_LABEL} activos
        </p>

        {tascas.length === 0 && !error && (
          <div className="rounded-[28px] px-6 py-8 text-center" style={{ backgroundColor: "var(--t-card)" }}>
            <p className="text-[16px] font-extrabold">Los locales se publican aquí</p>
            <p className="mt-2 text-[13px] font-semibold" style={{ color: "var(--t-muted)" }}>
              Pronto verás la red de locales aliados del piloto.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {tascas.map((tasca, i) => (
            <div key={tasca.id} style={{ animationDelay: `${i * 60}ms` }}>
              <VenueCard
                tasca={tasca}
                onView={() => navigate(`/tobo/venue/${tasca.slug}`)}
              />
            </div>
          ))}
        </div>

        {/* Prize banner (moved to the end to keep the focus on the venues) */}
        <div
          className="mt-6 rounded-[20px] p-5 shadow-[0_10px_24px_rgba(0,0,0,0.28)]"
          style={{ background: "linear-gradient(135deg, var(--t-accent-dim) 0%, var(--t-accent) 100%)", color: "var(--t-accent-text)" }}
        >
          <p className="text-[12px] font-extrabold uppercase tracking-[0.14em] opacity-90">
            🏆 Premio de la ronda
          </p>
          <p className="mt-0.5 text-[13px] font-semibold opacity-80">
            {active ? cyclePeriodLabel(active) : LVBP_SEASON_LABEL}
          </p>
          <p className="mt-3 text-[13px] font-extrabold opacity-95">
            {TOBO_ROUND_PRIZE_SUBTITLE}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { n: activeTascas.length, label: "locales" },
              { n: withPrize.length, label: "premios" },
              { n: 3, label: "ganadores 🥇" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl p-3 text-center" style={{ backgroundColor: "rgba(0,0,0,0.18)" }}>
                <p className="text-[24px] font-extrabold">{item.n}</p>
                <p className="text-[11px] font-bold opacity-85">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TabBar />
    </div>
  );
}
