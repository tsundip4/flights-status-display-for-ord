export async function fetchFlights({ baseUrl, airport, limit }) {
  const response = await fetch(
    `${baseUrl}/flights/aviationstack/${airport}?limit=${limit}`
  );

  if (!response.ok) {
    throw new Error("Unable to fetch Aviationstack data.");
  }

  return response.json();
}
