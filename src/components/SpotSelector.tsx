import { useEffect, useMemo, useState } from 'react';
import { Search, MapPin, Check } from 'lucide-react';
import { supabaseDivespot } from '@/lib/supabaseDivespot';
import type { DiveSpot } from '@/types/expedition';

interface SpotSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function SpotSelector({ selectedIds, onChange }: SpotSelectorProps) {
  const [spots, setSpots] = useState<DiveSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState<string>('Todos');
  const [region, setRegion] = useState<string>('Todas');

  useEffect(() => {
    let active = true;
    setLoading(true);
    supabaseDivespot
      .from('dive_sites')
      .select('*')
      .eq('status', 'approved')
      .order('country', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (!error) setSpots(data || []);
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  // Nivel 1: paises, ordenados por cantidad de spots
  const countries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of spots) {
      const c = s.country || 'Otros';
      counts.set(c, (counts.get(c) || 0) + 1);
    }
    return ['Todos', ...Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([c]) => c)];
  }, [spots]);

  // Nivel 2: regiones dentro del pais elegido (solo tiene sentido para Chile, que tiene varias)
  const regionsInCountry = useMemo(() => {
    if (country === 'Todos') return [];
    const counts = new Map<string, number>();
    for (const s of spots) {
      if ((s.country || 'Otros') !== country) continue;
      const r = s.region || 'Sin region';
      counts.set(r, (counts.get(r) || 0) + 1);
    }
    const list = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([r]) => r);
    return list.length > 1 ? ['Todas', ...list] : [];
  }, [spots, country]);

  useEffect(() => {
    setRegion('Todas');
  }, [country]);

  const toggleSpot = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const filtered = spots.filter((s) => {
    const matchesCountry = country === 'Todos' || (s.country || 'Otros') === country;
    const matchesRegion = region === 'Todas' || s.region === region;
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.city || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.region_zone || '').toLowerCase().includes(search.toLowerCase());
    return matchesCountry && matchesRegion && matchesSearch;
  });

  return (
    <div>
      {/* Nivel 1: Pais */}
      <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1 -mx-1 px-1">
        {countries.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCountry(c)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              country === c
                ? 'bg-padi-blue text-white'
                : 'bg-ocean-mid text-text-tertiary hover:bg-ocean-surface/30'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Nivel 2: Region (solo si el pais elegido tiene mas de una) */}
      {regionsInCountry.length > 0 && (
        <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1 -mx-1 px-1">
          {regionsInCountry.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all border ${
                region === r
                  ? 'bg-padi-blue/20 border-padi-blue text-padi-blue'
                  : 'bg-transparent border-ocean-surface/30 text-text-tertiary hover:border-ocean-surface/60'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      )}

      <div className="relative mb-2">
        <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar spot por nombre o ciudad..."
          className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl pl-9 pr-4 py-2.5 text-text-primary outline-none placeholder:text-text-tertiary text-sm"
        />
      </div>

      {selectedIds.length > 0 && (
        <p className="text-xs text-padi-blue mb-2">{selectedIds.length} spot(s) seleccionado(s)</p>
      )}

      <div className="max-h-56 overflow-y-auto space-y-1.5 border border-ocean-surface/20 rounded-xl p-2">
        {loading && (
          <p className="text-xs text-text-tertiary text-center py-4">Cargando spots...</p>
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-xs text-text-tertiary text-center py-4">No se encontraron spots</p>
        )}
        {!loading && filtered.length > 0 && (
          <p className="text-[10px] text-text-tertiary px-1">{filtered.length} spot(s)</p>
        )}
        {filtered.map((spot) => {
          const isSelected = selectedIds.includes(spot.id);
          return (
            <button
              key={spot.id}
              type="button"
              onClick={() => toggleSpot(spot.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${
                isSelected
                  ? 'bg-padi-blue/20 border border-padi-blue/40'
                  : 'bg-ocean-mid border border-transparent hover:border-ocean-surface/40'
              }`}
            >
              <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                isSelected ? 'bg-padi-blue' : 'border border-text-tertiary'
              }`}>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
              <MapPin className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-text-primary truncate">{spot.name}</p>
                <p className="text-xs text-text-tertiary truncate">
                  {spot.region_zone || spot.city || spot.region}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}