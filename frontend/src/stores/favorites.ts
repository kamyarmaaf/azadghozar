'use client';

import { create } from 'zustand';
import {
  addListingFavorite,
  fetchListingFavorites,
  removeListingFavorite,
  type VehicleListing,
} from '@/lib/listing-api';

interface FavoritesState {
  listings: VehicleListing[];
  favoriteIds: number[];
  mutatingIds: number[];
  isLoading: boolean;
  hasLoaded: boolean;
  error: string;
  loadFavorites: (force?: boolean) => Promise<void>;
  toggleFavorite: (listing: { id: number }) => Promise<boolean>;
  removeFavorite: (listingId: number) => Promise<void>;
  reset: () => void;
}

const initialState = {
  listings: [],
  favoriteIds: [],
  mutatingIds: [],
  isLoading: false,
  hasLoaded: false,
  error: '',
};

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'دریافت علاقه‌مندی‌ها انجام نشد.';
}

export const useFavorites = create<FavoritesState>((set, get) => ({
  ...initialState,

  loadFavorites: async (force = false) => {
    if (get().isLoading || (get().hasLoaded && !force)) return;
    set({ isLoading: true, error: '' });
    try {
      const response = await fetchListingFavorites();
      const listings = response.results.map((favorite) => favorite.listing);
      set({
        listings,
        favoriteIds: listings.map((listing) => listing.id),
        hasLoaded: true,
      });
    } catch (error) {
      set({ error: errorMessage(error), hasLoaded: true });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  toggleFavorite: async (listing) => {
    const isFavorite = get().favoriteIds.includes(listing.id);
    set((state) => ({
      mutatingIds: [...new Set([...state.mutatingIds, listing.id])],
      error: '',
    }));
    try {
      if (isFavorite) {
        await removeListingFavorite(listing.id);
        set((state) => ({
          listings: state.listings.filter((item) => item.id !== listing.id),
          favoriteIds: state.favoriteIds.filter((id) => id !== listing.id),
        }));
        return false;
      }

      const favorite = await addListingFavorite(listing.id);
      set((state) => ({
        listings: [
          favorite.listing,
          ...state.listings.filter((item) => item.id !== listing.id),
        ],
        favoriteIds: [
          listing.id,
          ...state.favoriteIds.filter((id) => id !== listing.id),
        ],
      }));
      return true;
    } catch (error) {
      set({ error: errorMessage(error) });
      throw error;
    } finally {
      set((state) => ({
        mutatingIds: state.mutatingIds.filter((id) => id !== listing.id),
      }));
    }
  },

  removeFavorite: async (listingId) => {
    if (get().mutatingIds.includes(listingId)) return;
    set((state) => ({
      mutatingIds: [...state.mutatingIds, listingId],
      error: '',
    }));
    try {
      await removeListingFavorite(listingId);
      set((state) => ({
        listings: state.listings.filter((item) => item.id !== listingId),
        favoriteIds: state.favoriteIds.filter((id) => id !== listingId),
      }));
    } catch (error) {
      set({ error: errorMessage(error) });
      throw error;
    } finally {
      set((state) => ({
        mutatingIds: state.mutatingIds.filter((id) => id !== listingId),
      }));
    }
  },

  reset: () => set(initialState),
}));
