export type Rates = Record<string, number>;

export async function fetchExchangeRates(base: string, symbols: string[]): Promise<Rates> {
  const key = import.meta.env.VITE_EXCHANGERATE_KEY;
  const params = new URLSearchParams({
    base,
    symbols: symbols.join(','),
  });
  if (key) params.set('access_key', key);

  const url = `https://api.exchangerate.host/latest?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Rates unavailable');
  const data = await res.json();
  if (!data?.rates) throw new Error('Rates unavailable');
  return data.rates as Rates;
}
