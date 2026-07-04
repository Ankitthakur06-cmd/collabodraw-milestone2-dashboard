import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../components/common/Layout";
import BoardCard from "../components/dashboard/BoardCard";
import CreateBoardModal from "../components/dashboard/CreateBoardModal";
import { createBoard, extractErrorMessage, getBoards } from "../api/apiClient";
import type { Board } from "../types";

export default function DashboardPage() {
  const navigate = useNavigate();

  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadBoards() {
      try {
        const data = await getBoards();
        if (!cancelled) setBoards(data);
      } catch (err) {
        if (!cancelled) {
          toast.error(extractErrorMessage(err, "Couldn't load your boards. Please try again."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBoards();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate(title: string) {
    setCreating(true);
    try {
      const board = await createBoard(title);
      setBoards((prev) => [board, ...prev]);
      setIsModalOpen(false);
      toast.success("Board created!");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Couldn't create the board. Please try again."));
    } finally {
      setCreating(false);
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your boards</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + New board
        </button>
      </div>

      {loading && <p className="mt-6 text-sm text-slate-500">Loading your boards…</p>}

      {!loading && boards.length === 0 && (
        <div className="mt-10 rounded-lg border border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-500">You don't have any boards yet.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-3 text-sm font-medium text-slate-900 hover:underline"
          >
            Create your first board
          </button>
        </div>
      )}

      {!loading && boards.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onOpen={(shareId) => navigate(`/board/${shareId}`)}
            />
          ))}
        </div>
      )}

      <CreateBoardModal
        isOpen={isModalOpen}
        submitting={creating}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreate}
      />
    </Layout>
  );
}
