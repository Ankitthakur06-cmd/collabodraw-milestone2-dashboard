import { useParams } from "react-router-dom";
import Layout from "../components/common/Layout";

// Placeholder only. Konva <Whiteboard>, <Toolbar>, live sync,
// and presence UI are implemented in Phases 3, 4, and 6.

export default function BoardPage() {
  const { shareId } = useParams();

  return (
    <Layout>
      <h1 className="text-2xl font-semibold">Board</h1>
      <p className="mt-2 text-slate-500">
        Canvas for board <code>{shareId}</code> goes here (Phase 3+).
      </p>
    </Layout>
  );
}
