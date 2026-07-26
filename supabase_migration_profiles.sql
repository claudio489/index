-- ============================================
-- MIGRACION: Perfil Sync & Completo
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Agregar columnas necesarias a profiles si no existen
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'local_id') THEN
    ALTER TABLE public.profiles ADD COLUMN local_id TEXT UNIQUE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_deleted') THEN
    ALTER TABLE public.profiles ADD COLUMN is_deleted BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- 2. Agregar columnas adicionales para todos los campos del perfil
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'birth_date') THEN
    ALTER TABLE public.profiles ADD COLUMN birth_date TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'certifications') THEN
    ALTER TABLE public.profiles ADD COLUMN certifications TEXT[] DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'dive_level') THEN
    ALTER TABLE public.profiles ADD COLUMN dive_level TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'training_center') THEN
    ALTER TABLE public.profiles ADD COLUMN training_center TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'instructor') THEN
    ALTER TABLE public.profiles ADD COLUMN instructor TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_language') THEN
    ALTER TABLE public.profiles ADD COLUMN preferred_language TEXT DEFAULT 'es';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'units') THEN
    ALTER TABLE public.profiles ADD COLUMN units TEXT DEFAULT 'metric';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'photo_url') THEN
    ALTER TABLE public.profiles ADD COLUMN photo_url TEXT;
  END IF;
END $$;

-- 3. RLS para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own their profile" ON public.profiles;
CREATE POLICY "Users own their profile"
  ON public.profiles FOR ALL
  USING (user_id = COALESCE(
    current_setting('request.headers.x-user-id', true),
    current_setting('app.current_user_id', true)
  ));

-- 4. Actualizar funcion sync_batch para soportar 'profiles'
CREATE OR REPLACE FUNCTION sync_batch(
  p_operations JSONB,
  p_user_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB := '[]'::JSONB;
  v_op JSONB;
  v_table TEXT;
  v_local_id TEXT;
  v_data JSONB;
  v_remote_id UUID;
  v_operation TEXT;
BEGIN
  FOR v_op IN SELECT * FROM jsonb_array_elements(p_operations)
  LOOP
    v_table := v_op->>'table';
    v_local_id := v_op->>'localId';
    v_data := v_op->'data';
    v_operation := v_op->>'operation';
    
    IF v_table = 'logbook' THEN
      INSERT INTO public.logbook_entries (local_id, user_id, data, updated_at)
      VALUES (v_local_id, p_user_id, v_data, now())
      ON CONFLICT (local_id) DO UPDATE SET
        data = EXCLUDED.data,
        updated_at = now()
      WHERE public.logbook_entries.user_id = p_user_id
      RETURNING id INTO v_remote_id;
      
    ELSIF v_table = 'equipment' THEN
      INSERT INTO public.equipment (local_id, user_id, data, updated_at)
      VALUES (v_local_id, p_user_id, v_data, now())
      ON CONFLICT (local_id) DO UPDATE SET
        data = EXCLUDED.data,
        updated_at = now()
      WHERE public.equipment.user_id = p_user_id
      RETURNING id INTO v_remote_id;
      
    ELSIF v_table = 'profiles' THEN
      INSERT INTO public.profiles (
        local_id, user_id, full_name, email, phone, birth_date, 
        certifications, dive_level, training_center, instructor,
        preferred_language, units, photo_url, updated_at, is_deleted
      )
      VALUES (
        v_local_id, p_user_id,
        v_data->>'fullName', v_data->>'email', v_data->>'phone', v_data->>'birthDate',
        ARRAY(SELECT jsonb_array_elements_text(v_data->'certifications')),
        v_data->>'diveLevel', v_data->>'trainingCenter', v_data->>'instructor',
        v_data->>'preferredLanguage', v_data->>'units', v_data->>'photoUrl',
        now(), false
      )
      ON CONFLICT (local_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        birth_date = EXCLUDED.birth_date,
        certifications = EXCLUDED.certifications,
        dive_level = EXCLUDED.dive_level,
        training_center = EXCLUDED.training_center,
        instructor = EXCLUDED.instructor,
        preferred_language = EXCLUDED.preferred_language,
        units = EXCLUDED.units,
        photo_url = EXCLUDED.photo_url,
        updated_at = now()
      WHERE public.profiles.user_id = p_user_id
      RETURNING id INTO v_remote_id;
      
    END IF;
    
    v_result := v_result || jsonb_build_object(
      'localId', v_local_id,
      'remoteId', v_remote_id,
      'table', v_table,
      'success', true
    );
  END LOOP;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Funcion para obtener perfil del usuario (para descarga en nuevo dispositivo)
CREATE OR REPLACE FUNCTION get_user_profile(p_user_id TEXT)
RETURNS TABLE (
  id UUID,
  local_id TEXT,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  birth_date TEXT,
  certifications TEXT[],
  dive_level TEXT,
  training_center TEXT,
  instructor TEXT,
  preferred_language TEXT,
  units TEXT,
  photo_url TEXT,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.local_id, p.full_name, p.email, p.phone, p.birth_date,
    p.certifications, p.dive_level, p.training_center, p.instructor,
    p.preferred_language, p.units, p.photo_url, p.updated_at
  FROM public.profiles p
  WHERE p.user_id = p_user_id
    AND p.is_deleted = false
  ORDER BY p.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
