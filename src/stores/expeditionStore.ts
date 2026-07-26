import { create } from 'zustand';
import { supabaseDivespot } from '@/lib/supabaseDivespot';
import { useDivespotAuthStore } from '@/stores/useDivespotAuthStore';
import type { Expedition, Reservation, DiveSpot, CreateExpeditionInput } from '@/types/expedition';

interface ExpeditionState {
  expeditions: Expedition[];
  myExpeditions: Expedition[];
  currentExpedition: Expedition | null;
  spots: DiveSpot[];
  reservations: Reservation[];
  expeditionReservations: Reservation[];
  loading: boolean;
  error: string | null;
  fetchExpeditions: () => Promise<void>;
  fetchMyExpeditions: () => Promise<void>;
  fetchExpeditionById: (id: string) => Promise<void>;
  fetchSpotsByIds: (ids: string[]) => Promise<void>;
  joinExpedition: (expeditionId: string) => Promise<boolean>;
  getUserReservations: () => Promise<void>;
  getSpotsAvailable: (expedition: Expedition) => number;
  createExpedition: (input: CreateExpeditionInput) => Promise<Expedition | null>;
  updateExpedition: (id: string, input: CreateExpeditionInput) => Promise<boolean>;
  fetchExpeditionReservations: (expeditionId: string) => Promise<void>;
  updateReservationStatus: (reservationId: string, status: string) => Promise<boolean>;
  clearError: () => void;
}

export const useExpeditionStore = create<ExpeditionState>()((set, get) => ({
  expeditions: [],
  myExpeditions: [],
  currentExpedition: null,
  spots: [],
  reservations: [],
  expeditionReservations: [],
  loading: false,
  error: null,

  fetchExpeditions: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabaseDivespot
        .from('expeditions')
        .select('*')
        .order('start_date', { ascending: true });
      if (error) throw error;
      set({ expeditions: data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchMyExpeditions: async () => {
    set({ loading: true, error: null });
    try {
      const userId = useDivespotAuthStore.getState().userId;
      if (!userId) {
        set({ myExpeditions: [], loading: false });
        return;
      }

      const { data: myReservations, error: resError } = await supabaseDivespot
        .from('reservations')
        .select('*')
        .eq('user_id', userId);
      if (resError) throw resError;

      const expeditionIds = Array.from(
        new Set((myReservations || []).map((r) => r.expedition_id).filter(Boolean))
      );

      if (expeditionIds.length === 0) {
        set({ myExpeditions: [], reservations: myReservations || [], loading: false });
        return;
      }

      const { data: myExps, error: expError } = await supabaseDivespot
        .from('expeditions')
        .select('*')
        .in('id', expeditionIds)
        .order('start_date', { ascending: true });
      if (expError) throw expError;

      set({ myExpeditions: myExps || [], reservations: myReservations || [], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchExpeditionById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabaseDivespot
        .from('expeditions')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      set({ currentExpedition: data, loading: false });
      if (data?.site_ids?.length > 0) {
        await get().fetchSpotsByIds(data.site_ids);
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchSpotsByIds: async (ids: string[]) => {
    try {
      const { data, error } = await supabaseDivespot
        .from('dive_sites')
        .select('*')
        .in('id', ids);
      if (error) throw error;
      set({ spots: data || [] });
    } catch (err: any) {
      console.error('Error fetching spots:', err.message);
    }
  },

  joinExpedition: async (expeditionId: string) => {
    try {
      const userId = useDivespotAuthStore.getState().userId;
      if (!userId) throw new Error('Usuario no autenticado');

      const { error } = await supabaseDivespot
        .from('reservations')
        .insert({
          user_id: userId,
          expedition_id: expeditionId,
          status: 'pending',
          created_at: new Date().toISOString()
        });
      if (error) throw error;

      const current = get().currentExpedition;
      if (current) {
        const newFilled = (current.spots_filled || 0) + 1;
        await supabaseDivespot
          .from('expeditions')
          .update({ spots_filled: newFilled })
          .eq('id', expeditionId);
        set({ currentExpedition: { ...current, spots_filled: newFilled } });
      }

      await get().getUserReservations();
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },

  getUserReservations: async () => {
    try {
      const userId = useDivespotAuthStore.getState().userId;
      if (!userId) return;

      const { data, error } = await supabaseDivespot
        .from('reservations')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      set({ reservations: data || [] });
    } catch (err: any) {
      console.error('Error fetching reservations:', err.message);
    }
  },

  getSpotsAvailable: (expedition: Expedition) => {
    return (expedition.spots_total || 0) - (expedition.spots_filled || 0);
  },

  createExpedition: async (input: CreateExpeditionInput) => {
    set({ loading: true, error: null });
    try {
      const userId = useDivespotAuthStore.getState().userId;
      if (!userId) throw new Error('Usuario no autenticado');

      const { data, error } = await supabaseDivespot
        .from('expeditions')
        .insert({
          title: input.title,
          description: input.description || null,
          site_ids: input.site_ids || [],
          start_date: input.start_date || null,
          end_date: input.end_date || null,
          spots_total: input.spots_total || 6,
          spots_filled: 0,
          price_per_person: input.price_per_person || null,
          currency: input.currency || 'CLP',
          min_cert: input.min_cert || null,
          status: 'open',
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        expeditions: [...state.expeditions, data],
        loading: false,
      }));
      return data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  updateExpedition: async (id: string, input: CreateExpeditionInput) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabaseDivespot
        .from('expeditions')
        .update({
          title: input.title,
          description: input.description || null,
          site_ids: input.site_ids || [],
          start_date: input.start_date || null,
          end_date: input.end_date || null,
          spots_total: input.spots_total || 6,
          price_per_person: input.price_per_person || null,
          currency: input.currency || 'CLP',
          min_cert: input.min_cert || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        expeditions: state.expeditions.map((e) => (e.id === id ? data : e)),
        currentExpedition: state.currentExpedition?.id === id ? data : state.currentExpedition,
        loading: false,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  fetchExpeditionReservations: async (expeditionId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabaseDivespot
        .from('reservations')
        .select('*')
        .eq('expedition_id', expeditionId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      set({ expeditionReservations: data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  updateReservationStatus: async (reservationId: string, status: string) => {
    try {
      const { error } = await supabaseDivespot
        .from('reservations')
        .update({ status })
        .eq('id', reservationId);
      if (error) throw error;

      set((state) => ({
        expeditionReservations: state.expeditionReservations.map((r) =>
          r.id === reservationId ? { ...r, status } : r
        ),
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },

  clearError: () => set({ error: null })
}));

