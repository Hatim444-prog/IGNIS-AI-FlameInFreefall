import LiveFire from "./LiveFire";
import DocumentCollection from "./DocumentCollection";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ChartColumn,
  FileText,
  FlaskConical,
  Info,
  MessagesSquare,
  Rocket,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { State, RunLink } from "./common";
import { useAllExperiments } from "./api";

const workflows = [
  {
    href: "/experiments",
    title: "Experiments",
    text: "Explore combustion experiments and conditions.",
    Icon: FlaskConical,
    tag: "EXPLORE",
  },
  {
    href: "/analytics",
    title: "Data comparison",
    text: "Compare measurements and visualize the results.",
    Icon: ChartColumn,
    tag: "COMPARE",
  },
  {
    href: "/assistant",
    title: "AI research assistant",
    text: "Ask questions and get evidence-backed answers.",
    Icon: MessagesSquare,
    tag: "DISCOVER",
  },
  {
    href: "/media",
    title: "Visual lab",
    text: "Analyze flame images and videos qualitatively.",
    Icon: ScanLine,
    tag: "OBSERVE",
  },
  {
    href: "/mission-advisor",
    title: "Mission advisor",
    text: "Find relevant studies for a space scenario.",
    Icon: Rocket,
    tag: "CONNECT",
  },
];

function FlameComparison() {
  return <figure className="reference-comparison" role="img" aria-label="Conceptual comparison of an elongated Earth flame and a spherical microgravity flame" />;
}

export default function Overview() {
  const q = useAllExperiments();
  const experiments = q.data ?? [];
  return (
    <div className="dashboard">
      <section className="mission-hero"><LiveFire />
        <div className="hero-copy">
          <div className="mission-eyebrow">
            <span /> NASA Space Apps 2026
          </div>
          <h1>
            Exploring <span>Fire</span> in Microgravity
          </h1>
          <p>
            Your workspace for combustion research. Explore experiments, compare
            measurements, and turn scientific evidence into deeper
            understanding.
          </p>
          <div className="actions">
            <Link className="action primary" to="/experiments">
              <FlaskConical size={17} /> Explore experiments{" "}
              <ArrowRight size={16} />
            </Link>
            <Link className="action hero-secondary" to="/assistant">
              <Sparkles size={17} /> Ask IGNIS AI
            </Link>
          </div>

        </div>
        <FlameComparison />
      </section>

      <DocumentCollection />
      <section className="workflow-grid" aria-label="Research tools">
        {workflows.map(({ href, title, text, Icon }) => (
          <Link className="workflow-card" to={href} key={href}>
            <div className="workflow-card-top">
              <span className="workflow-icon">
                <Icon size={24} strokeWidth={1.6} />
              </span>
              <ArrowUpRight size={17} className="workflow-arrow" />
            </div>
            <h3>{title}</h3>
            <p>{text}</p>

          </Link>
        ))}
      </section>

      <div className="dashboard-bottom">
        <section className="panel experiments-panel">
          <div className="panel-heading">
            <h2>
              <FlaskConical size={20} /> Experiment collection
            </h2>
            <Link to="/experiments">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <State query={q} />
          {q.data && !experiments.length && (
            <div className="dashboard-empty">
              <FlaskConical size={28} />
              <p>No experiments indexed yet.</p>
              <Link to="/settings">
                Check data connection <ArrowRight size={14} />
              </Link>
            </div>
          )}
          {!!experiments.length && (
            <div className="table">
              <table>
                <thead>
                  <tr>
                    <th>Experiment</th>
                    <th>Fuel</th>
                    <th>Gravity</th>
                    <th>Origin</th>
                  </tr>
                </thead>
                <tbody>
                  {experiments.slice(0, 3).map((e) => (
                    <tr key={e.investigation_code + e.experiment_code}>
                      <td>
                        <div className="experiment-identity">
                          <span className="experiment-icon">
                            <FlaskConical size={17} />
                          </span>
                          <div>
                            <RunLink code={e.experiment_code} />
                            <span
                              className="experiment-study"
                              title={e.investigation_title || undefined}
                            >
                              {e.investigation_title || e.investigation_code}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{e.fuel_material || "Not reported"}</td>
                      <td>
                        <span className="condition-pill">
                          {e.gravity_condition === "microgravity"
                            ? "µg"
                            : e.gravity_condition || "Unknown"}
                        </span>
                      </td>
                      <td>
                        <span className="origin-pill">
                          {e.investigation_code.startsWith("ZARM")
                            ? "ZARM"
                            : e.investigation_code}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="panel-footnote">
            <span className="live-dot" /> Live collection · NASA attribution
            requires verified provenance.
          </div>
        </section>

        <section className="panel mission-card">
          <div className="panel-heading">
            <h2><Rocket size={22} /> Mission Advisor</h2>
          </div>
          <p className="scenario-intro">Define your space scenario and find the most relevant studies and evidence.</p>
          <div className="scenario-art" aria-hidden="true" />
          <Link className="action mission-cta" to="/mission-advisor">Define a Scenario <ArrowRight size={16} /></Link>
        </section>

        <section className="panel coverage-panel">
          <div className="panel-heading"><h2><FileText size={20}/> Featured PDFs</h2><Link to="/sources">View all <ArrowRight size={14}/></Link></div>
          {["FLARE","FM2","SOFIE"].map(name=><a className="document-row" key={name} href={"/papers/"+name+".pdf"} target="_blank" rel="noreferrer"><span>PDF</span><div><strong>{name}</strong><p>Research document · Open PDF</p></div></a>)}
        </section>
      </div>
      <div className="research-disclaimer">
        <Info size={19} />
        <p>
          <strong>Important:</strong> IGNIS provides evidence
          from available studies. It is <span>not a fire risk predictor</span>{" "}
          and <span>does not certify safety.</span>
        </p>
      </div>

    </div>
  );
}
