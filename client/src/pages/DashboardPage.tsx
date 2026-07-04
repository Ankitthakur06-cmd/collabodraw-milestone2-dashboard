import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/common/Layout";
import BoardCard from "../components/dashboard/BoardCard";
import CreateBoardModal from "../components/dashboard/CreateBoardModal";
import JoinBoardModal from "../components/dashboard/JoinBoardModal";
import { useAuthStore } from "../store/authStore";
import { useBoardsStore } from "../store/boardsStore";
import type { BoardFilter } from "../store/boardsStore";

const FILTERS: { value: BoardFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "owned", label: "Owned" },
  { value: "shared", label: "Shared" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const boards = useBoardsStore((state) => state.boards);
  const selectedFilter = useBoardsStore((state) => state.selectedFilter);
  const loading = useBoardsStore((state) => state.loading);
  const error = useBoardsStore((state) => state.error);
  const setFilter = useBoardsStore((state) => state.setFilter);
  const fetchBoards = useBoardsStore((state) => state.fetchBoards);
  const createBoard = useBoardsStore((state) => state.createBoard);
  const deleteBoard = useBoardsStore((state) => state.deleteBoard);
  const joinBoard = useBoardsStore((state) => state.joinBoard);

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  // Search + tab filtering is a pure derived view over the store's raw
  // list — kept out of the store so there's one source of truth.
  const visibleBoards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return boards.filter((board) => {
      const matchesFilter =
        selectedFilter === "all" ||
        (selectedFilter === "owned" && board.ownerId === currentUserId) ||
        (selectedFilter === "shared" && board.ownerId !== currentUserId);

      const matchesSearch = query === "" || board.title.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [boards, selectedFilter, searchQuery, currentUserId]);

  async function handleCreate(title: string) {
    setCreating(true);
    const board = await createBoard(title);
    setCreating(false);
    if (board) setIsCreateOpen(false);
  }

  async function handleJoin(shareId: string) {
    setJoining(true);
    const board = await joinBoard(shareId);
    setJoining(false);
    if (board) {
      setIsJoinOpen(false);
      navigate(`/board/${board.shareId}`);
    }
  }

  function handleDelete(id: string) {
    deleteBoard(id);
  }

  return (
    <Layout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Boards</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your collaborative whiteboards</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsJoinOpen(true)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Join Board
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            + New Board
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search boards..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400 sm:max-w-xs"
        />
        <div className="flex gap-1 rounded-md border border-slate-200 bg-white p-1">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilter(filter.value)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                selectedFilter === filter.value
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="mt-10 rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => fetchBoards()}
            className="mt-3 text-sm font-medium text-red-700 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && boards.length === 0 && (
        <div className="mt-10 rounded-lg border border-dashed border-slate-300 p-10 text-center">
          <p className="text-3xl">🖊️</p>
          <p className="mt-2 text-slate-500">No boards yet</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-3 text-sm font-medium text-slate-900 hover:underline"
          >
            Create your first board
          </button>
        </div>
      )}

      {!loading && !error && boards.length > 0 && visibleBoards.length === 0 && (
        <p className="mt-10 text-center text-sm text-slate-500">No boards match your search.</p>
      )}

      {!loading && !error && visibleBoards.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleBoards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              isOwner={board.ownerId === currentUserId}
              onOpen={(shareId) => navigate(`/board/${shareId}`)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <CreateBoardModal
        isOpen={isCreateOpen}
        submitting={creating}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
      />

      <JoinBoardModal
        isOpen={isJoinOpen}
        submitting={joining}
        onClose={() => setIsJoinOpen(false)}
        onJoin={handleJoin}
      />
    </Layout>
  );
}
