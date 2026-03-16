import { useParams } from "react-router-dom";
import EditorMain from "./EditorMain";

export default function EditorPage() {
  const { id } = useParams();

  if (!id) return <div>Loading…</div>;

  return <EditorMain roomID={id} />;
}
