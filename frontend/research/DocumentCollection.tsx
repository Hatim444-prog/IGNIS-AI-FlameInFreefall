import { Link } from "react-router-dom";
import { useDocuments } from "./api";
import { State } from "./common";

export default function DocumentCollection({ search = "" }: { search?: string }) {
  const documents = useDocuments();
  const query = search.trim().toLowerCase();
  const matches = documents.data?.filter(d => d.filename.replaceAll("_", " ").toLowerCase().includes(query.replaceAll("_", " ")));
  return <section className="panel">
    <div className="panel-heading"><h2>Research documents</h2><Link to="/sources">Browse sources →</Link></div>
    <State query={documents}/>
    {matches && <>
      <p>{matches.length} {query ? "matching" : "indexed"} documents · Select a title to ask about its evidence.</p>
      <div className="actions">{matches.map(d=><Link className="action" key={d.filename} to={"/assistant?document="+encodeURIComponent(d.filename)}>{d.filename}</Link>)}</div>
    </>}
  </section>;
}
