export interface SpoonacularSearchResult {
  id: number;
  title: string;
  image: string;
  imageType: string;
}

export interface SpoonacularSearchResponse {
  products: SpoonacularSearchResult[];
  totalProducts: number;
  type: string;
  offset: number;
  number: number;
}

export interface SpoonacularProductResponse {
  id: number;
  title: string;
  upc: string;
  // Add other fields as needed
}
