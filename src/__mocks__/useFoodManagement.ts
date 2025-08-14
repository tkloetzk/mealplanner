// src/__mocks__/useFoodManagement.ts
import { MOCK_FOODS } from "./testConstants";

export const useFoodManagement = () => ({
  foodOptions: MOCK_FOODS,
  selectedFoodContext: null,
  setSelectedFoodContext: jest.fn(),
  fetchFoodOptions: jest.fn(),
  handleToggleVisibility: jest.fn(),
  handleToggleAllOtherFoodVisibility: jest.fn(),
  handleSaveFood: jest.fn(),
  handleDeleteFood: jest.fn(),
});