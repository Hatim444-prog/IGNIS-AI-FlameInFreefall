import "./style.css";
import Shell from "@/research/Shell";
// Next.js reads this named route export.
// oxlint-disable-next-line react/only-export-components
export const metadata = {
  title: "IGNIS AI · Combustion research",
  description:
    "Explore combustion experiments, measurements and mission research.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
