import React, { lazy } from 'react';

// Heavy components that should be dynamically imported
export const LazyFoodImageAnalysis = lazy(() => 
  import('../../../food/FoodAnalysis/components/FoodImageAnalysis/FoodImageAnalysis').then(module => ({
    default: module.FoodImageAnalysis
  }))
);

export const LazyMealAnalysis = lazy(() =>
  import('../../MealAnalysis/MealAnalysis').then(module => ({
    default: module.MealAnalysis
  }))
);

export const LazyFoodEditor = lazy(() =>
  import('../../../food/FoodEditor').then(module => ({
    default: module.FoodEditor
  }))
);

export const LazyMealEditor = lazy(() =>
  import('../../MealEditor/MealEditor').then(module => ({
    default: module.MealEditor
  }))
);

export const LazyChildView = lazy(() =>
  import('../../ChildView/ChildView').then(module => ({
    default: module.ChildView
  }))
);

// Loading fallback component
export const ComponentLoader: React.FC = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
  </div>
);