import { create } from 'zustand';
import { type CardDef } from '@/features/card/domain/card.schema';

interface CardsState {
  cards: CardDef[];
  isLoaded: boolean;
  setCards: (items: CardDef[]) => void;
  setLoaded: (val: boolean) => void;
}

export const useCardStore = create<CardsState>((set) => ({
  cards: [],
  isLoaded: false,
  setCards: (items: CardDef[]) => set({ cards: items, isLoaded: true }),
  setLoaded: (val: boolean) => set({ isLoaded: val }),
}));
