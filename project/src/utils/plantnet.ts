export interface PlantNetSpecies {
  scientificNameWithoutAuthor: string;
  scientificNameAuthorship: string;
  commonNames: string[];
  family: { scientificNameWithoutAuthor: string };
}

export interface PlantNetResult {
  score: number;
  species: PlantNetSpecies;
  images: Array<{ url: { s: string; m: string; o: string } }>;
}

export async function identifyPlant(
  images: { file: File; organ: 'leaf' | 'auto' | 'flower' | 'bark' | 'fruit' }[],
  apiKey: string
): Promise<PlantNetResult[]> {
  const formData = new FormData();
  for (const img of images) {
    formData.append('images', img.file);
    formData.append('organs', img.organ);
  }

  const response = await fetch(
    `https://my-api.plantnet.org/v2/identify/all?api-key=${encodeURIComponent(apiKey)}&lang=en&nb-results=5`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('No plant identified — try a clearer or different photo.');
    }
    if (response.status === 401) {
      throw new Error('Invalid API key. Check your key at my.plantnet.org.');
    }
    throw new Error(`Identification failed (${response.status}). Please try again.`);
  }

  const data = await response.json();
  return data.results as PlantNetResult[];
}
