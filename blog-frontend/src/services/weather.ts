export type WeatherPlace = {
  lat: number;
  lon: number;
  label: string;
  fromBrowser: boolean;
};

const DEFAULT_PLACE: WeatherPlace = {
  lat: Number(import.meta.env.VITE_WEATHER_LAT || 40.7128),
  lon: Number(import.meta.env.VITE_WEATHER_LON || -74.006),
  label: import.meta.env.VITE_WEATHER_LABEL || 'New York',
  fromBrowser: false,
};

let placePromise: Promise<WeatherPlace> | null = null;

export function defaultWeatherPlace(): WeatherPlace {
  return { ...DEFAULT_PLACE };
}

export function resolveWeatherPlace(locale: string): Promise<WeatherPlace> {
  if (!placePromise) {
    placePromise = detectWeatherPlace(locale);
  }
  return placePromise;
}

async function detectWeatherPlace(locale: string): Promise<WeatherPlace> {
  try {
    const coords = await getBrowserCoords(5000);
    const label = await reverseGeocode(coords.lat, coords.lon, locale);
    return {
      lat: coords.lat,
      lon: coords.lon,
      label,
      fromBrowser: true,
    };
  } catch {
    return defaultWeatherPlace();
  }
}

function getBrowserCoords(timeoutMs: number): Promise<{ lat: number; lon: number }> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.reject(new Error('Geolocation unavailable'));
  }

  const geo = new Promise<{ lat: number; lon: number }>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        }),
      () => reject(new Error('Geolocation denied')),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 30 * 60 * 1000 }
    );
  });

  const timeout = new Promise<{ lat: number; lon: number }>((_, reject) => {
    setTimeout(() => reject(new Error('Geolocation timeout')), timeoutMs);
  });

  return Promise.race([geo, timeout]);
}

async function reverseGeocode(lat: number, lon: number, locale: string): Promise<string> {
  const language = locale === 'ru' ? 'ru' : 'en';
  const url =
    `https://api.bigdatacloud.net/data/reverse-geocode-client` +
    `?latitude=${lat}&longitude=${lon}&localityLanguage=${language}`;

  const res = await fetch(url);
  if (!res.ok) return '';

  const data = (await res.json()) as {
    city?: string;
    locality?: string;
    principalSubdivision?: string;
  };

  const city = data.city || data.locality || data.principalSubdivision || '';
  return city;
}

export async function fetchWeather(lat: number, lon: number) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
    `&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather unavailable');
  const data = await res.json();
  return {
    temperature: data.current?.temperature_2m as number,
    humidity: data.current?.relative_humidity_2m as number,
    wind: data.current?.wind_speed_10m as number,
    code: data.current?.weather_code as number,
    unit: data.current_units?.temperature_2m as string,
  };
}

export function weatherLabel(code: number, locale: string): string {
  const map: Record<number, { en: string; ru: string }> = {
    0: { en: 'Clear', ru: 'Ясно' },
    1: { en: 'Mainly clear', ru: 'Преимущественно ясно' },
    2: { en: 'Partly cloudy', ru: 'Переменная облачность' },
    3: { en: 'Overcast', ru: 'Пасмурно' },
    45: { en: 'Fog', ru: 'Туман' },
    48: { en: 'Rime fog', ru: 'Изморозь' },
    51: { en: 'Light drizzle', ru: 'Морось' },
    61: { en: 'Rain', ru: 'Дождь' },
    71: { en: 'Snow', ru: 'Снег' },
    80: { en: 'Rain showers', ru: 'Ливень' },
    95: { en: 'Thunderstorm', ru: 'Гроза' },
  };
  const entry = map[code] || { en: 'Mixed', ru: 'Переменно' };
  return locale === 'ru' ? entry.ru : entry.en;
}
