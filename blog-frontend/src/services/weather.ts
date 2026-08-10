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
