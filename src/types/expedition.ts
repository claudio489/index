export interface DiveSpot {
  id: string;
  name: string;
  description: string | null;
  lat: number;
  lng: number;
  city: string | null;
  max_depth: number | null;
  is_tec: boolean | null;
  likes_count: number | null;
  plans_count: number | null;
  status: string | null;
  legacy_id?: string | null;
  country?: string | null;
  region?: string | null;
  region_zone?: string | null;
  spot_type?: string | null;
  features?: string | null;
  best_for?: string | null;
  best_season?: string | null;
  avg_temp?: string | null;
  avg_vis?: string | null;
  logistics?: string | null;
  cover_image?: string | null;
  created_at?: string;
}

export interface Expedition {
  id: string;
  title: string;
  description: string | null;
  site_ids: string[] | null;
  start_date: string | null;
  end_date: string | null;
  spots_total: number | null;
  spots_filled: number | null;
  price_per_person: number | null;
  currency: string | null;
  min_cert: string | null;
  status: string | null;
  created_by: string | null;
  created_at?: string;
}

export interface Reservation {
  id: string;
  expedition_id: string | null;
  user_id: string | null;
  status: string | null;
  created_at?: string;
}

export interface CreateExpeditionInput {
  title: string;
  description?: string;
  site_ids?: string[];
  start_date?: string;
  end_date?: string;
  spots_total?: number;
  price_per_person?: number;
  currency?: string;
  min_cert?: string;
}