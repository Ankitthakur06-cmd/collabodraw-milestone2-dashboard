import { create } from "zustand";
import toast from "react-hot-toast";
import type { Board } from "../types";
import {
  createBoard as createBoardApi,
  deleteBoard as deleteBoardApi,
  extractErrorMessage,
  getBoards,
  joinBoard as joinBoardApi,
} from "../api/apiClient";

// Dashboard board-list state. Not part of the original architecture's
// three named stores (auth/board(canvas)/presence) — this is a new,
// narrowly-scoped store for the Dashboard's own needs (list, filter,
// loading, error), separate from boardStore.ts (canvas shapes, Phase 3).

export type BoardFilter = "all" | "owned" | "shared";

interface BoardsState {
  boards: Board[];
  selectedFilter: BoardFilter;
  loading: boolean;
  error: string | null;
  setFilter: (filter: BoardFilter) => void;
  fetchBoards: () => Promise<void>;
  createBoard: (title: string) => Promise<Board | null>;
  deleteBoard: (id: string) => Promise<boolean>;
  joinBoard: (shareId: string) => Promise<Board | null>;
}

export const useBoardsStore = create<BoardsState>((set, get) => ({
  boards: [],
  selectedFilter: "all",
  loading: false,
  error: null,

  setFilter: (filter) => set({ selectedFilter: filter }),

  fetchBoards: async () => {
    set({ loading: true, error: null });
    try {
      const boards = await getBoards();
      set({ boards, loading: false });
    } catch (err) {
      set({ loading: false, error: extractErrorMessage(err, "Couldn't load your boards.") });
    }
  },

  createBoard: async (title) => {
    try {
      const board = await createBoardApi(title);
      set({ boards: [board, ...get().boards] });
      toast.success("Board created!");
      return board;
    } catch (err) {
      toast.error(extractErrorMessage(err, "Couldn't create the board. Please try again."));
      return null;
    }
  },

  deleteBoard: async (id) => {
    try {
      await deleteBoardApi(id);
      set({ boards: get().boards.filter((board) => board.id !== id) });
      toast.success("Board deleted");
      return true;
    } catch (err) {
      toast.error(extractErrorMessage(err, "Couldn't delete the board. Please try again."));
      return false;
    }
  },

  joinBoard: async (shareId) => {
    try {
      const board = await joinBoardApi(shareId);
      set((state) => {
        const alreadyPresent = state.boards.some((existing) => existing.id === board.id);
        return alreadyPresent ? state : { boards: [board, ...state.boards] };
      });
      return board;
    } catch (err) {
      toast.error(
        extractErrorMessage(err, "Couldn't find that board. Check the share ID and try again.")
      );
      return null;
    }
  },
}));
