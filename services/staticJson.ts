/** Deel zowel lopende als afgeronde aanvragen binnen één app-sessie. */
export function createStaticJsonLoader(request: typeof fetch = (input, init) => fetch(input, init)) {
  const requests = new Map<string, Promise<unknown>>();
  return function load<T = unknown>(url: string): Promise<T> {
    let pending = requests.get(url);
    if (!pending) {
      pending = Promise.resolve().then(() => request(url)).then(response => {
        if (!response.ok) throw new Error(`Statische gegevens niet bereikbaar: ${response.status}`);
        return response.json();
      }).catch(error => { requests.delete(url); throw error; });
      requests.set(url, pending);
    }
    return pending as Promise<T>;
  };
}
export const loadStaticJson = createStaticJsonLoader();
