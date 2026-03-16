import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MEAL_TYPES } from "@/constants";
import type { MealType } from "@/types/shared";
import { DAILY_GOALS, MILK_OPTION } from "@/constants/meal-goals";
import { getPediatricGuidelines } from "@/constants/pediatric-nutrition-guidelines";
import type { Food } from "@/types/food";
import { distributeMealCalories, adjustForActivity } from "@/utils/nutritionUtils";

type NutritionMode = "recommended" | "custom";
type NutritionScope = "per_day" | "per_meal";

type MacroRange = {
  min: number;
  max: number;
};

type CustomNutritionGoals = {
  dailyCalories: number;
  mealCalories: Partial<Record<MealType, number>>;
  protein: MacroRange;
  carbs: MacroRange;
  fat: MacroRange;
  sodium?: MacroRange;
  sugar?: MacroRange;
  saturatedFat?: MacroRange;
};

export type ActivityLevel = 'sedentary' | 'moderate' | 'active';

export type KidSettings = {
  id: string;
  name: string;
  age: number;
  activityLevel?: ActivityLevel;  // Optional enhancement
  restrictions?: string; // Dietary restrictions, allergies, etc.
};

type AppSettingsState = {
  enabledMeals: MealType[];
  kids: KidSettings[];
  milkFood: Food;
  setMilkFood: (food: Food) => void;
  resetMilkFood: () => void;

  nutritionMode: NutritionMode;
  nutritionScope: NutritionScope;
  sameGoalsForAllKids: boolean;

  customGoalsByKidId: Record<string, CustomNutritionGoals>;
  customGoalsForAllKids: CustomNutritionGoals;

  setEnabledMeals: (meals: MealType[]) => void;
  setMealEnabled: (meal: MealType, enabled: boolean) => void;

  addKid: () => void;
  updateKid: (kidId: string, patch: Partial<Omit<KidSettings, "id">>) => void;
  removeKid: (kidId: string) => void;

  setNutritionMode: (mode: NutritionMode) => void;
  setNutritionScope: (scope: NutritionScope) => void;
  setSameGoalsForAllKids: (same: boolean) => void;

  setCustomGoalsForKid: (kidId: string, goals: CustomNutritionGoals) => void;
  setCustomGoalsForAllKids: (goals: CustomNutritionGoals) => void;

  hydrateFromServer: () => Promise<void>;
  syncToServer: () => Promise<void>;

  getEnabledMeals: () => MealType[];
  getTargetsForKid: (kidId: string) => {
    dailyCalories: number;
    mealCalories: Record<MealType, number>;
    protein: MacroRange;
    carbs: MacroRange;
    fat: MacroRange;
    sodium?: MacroRange;
    sugar?: MacroRange;
    saturatedFat?: MacroRange;
  };
  getMealCaloriesTarget: (kidId: string, meal: MealType) => number;
};

const createLocalId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const defaultCustomGoals = (): CustomNutritionGoals => ({
  dailyCalories: DAILY_GOALS.dailyTotals.calories,
  mealCalories: { ...DAILY_GOALS.mealCalories },
  protein: { ...DAILY_GOALS.dailyTotals.protein },
  carbs: { min: 0, max: 0 },
  fat: { ...DAILY_GOALS.dailyTotals.fat },
  sodium: { max: DAILY_GOALS.dailyTotals.sodiumMax },
  sugar: { max: 25 }, // Default: AAP/AHA recommendation for added sugars
  saturatedFat: { max: 20 }, // Default: AAP/AHA recommendation for saturated fat
});

const normalizeEnabledMeals = (meals: MealType[]) => {
  const allowed = new Set(MEAL_TYPES as readonly string[]);
  return meals.filter((m) => allowed.has(m)) as MealType[];
};

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set, get) => ({
      enabledMeals: [...(MEAL_TYPES as readonly MealType[])],
      kids: [
        { id: "1", name: "Presley", age: 5, activityLevel: 'moderate' },
        { id: "2", name: "Evy", age: 3, activityLevel: 'active' },
      ],
      milkFood: MILK_OPTION,

      nutritionMode: "recommended",
      nutritionScope: "per_meal",
      sameGoalsForAllKids: false,

      customGoalsByKidId: {},
      customGoalsForAllKids: defaultCustomGoals(),

      setMilkFood: (food) => set({ milkFood: food }),
      resetMilkFood: () => set({ milkFood: MILK_OPTION }),

      setEnabledMeals: (meals) =>
        set({ enabledMeals: normalizeEnabledMeals(meals) }),

      setMealEnabled: (meal, enabled) => {
        const current = get().enabledMeals;
        const next = enabled
          ? Array.from(new Set([...current, meal]))
          : current.filter((m) => m !== meal);
        set({ enabledMeals: normalizeEnabledMeals(next) });
      },

      addKid: () => {
        const id = createLocalId();
        set({ kids: [...get().kids, { id, name: "", age: 0, activityLevel: 'moderate' }] });
      },

      updateKid: (kidId, patch) => {
        set({
          kids: get().kids.map((kid) =>
            kid.id === kidId ? { ...kid, ...patch } : kid
          ),
        });
      },

      removeKid: (kidId) => {
        const nextKids = get().kids.filter((k) => k.id !== kidId);
        set({ kids: nextKids });
      },

      setNutritionMode: (mode) => set({ nutritionMode: mode }),
      setNutritionScope: (scope) => set({ nutritionScope: scope }),
      setSameGoalsForAllKids: (same) => set({ sameGoalsForAllKids: same }),

      setCustomGoalsForKid: (kidId, goals) => {
        set({
          customGoalsByKidId: {
            ...get().customGoalsByKidId,
            [kidId]: goals,
          },
        });
      },

      setCustomGoalsForAllKids: (goals) =>
        set({ customGoalsForAllKids: goals }),

      getEnabledMeals: () => {
        const enabled = get().enabledMeals;
        return enabled.length
          ? enabled
          : [...(MEAL_TYPES as readonly MealType[])];
      },

      getTargetsForKid: (kidId) => {
        const state = get();
        const enabledMeals = state.getEnabledMeals();

        if (state.nutritionMode === "recommended") {
          // NEW: Age-based lookup
          const kid = state.kids.find(k => k.id === kidId);
          if (!kid) return {
            dailyCalories: DAILY_GOALS.dailyTotals.calories,
            mealCalories: DAILY_GOALS.mealCalories as Record<MealType, number>,
            protein: DAILY_GOALS.dailyTotals.protein,
            carbs: { min: 0, max: 0 },
            fat: DAILY_GOALS.dailyTotals.fat,
            sodium: { max: DAILY_GOALS.dailyTotals.sodiumMax },
            sugar: { max: 25 }, // Default fallback: AAP/AHA recommendation for added sugars
            saturatedFat: { max: 20 }, // Default fallback: AAP/AHA recommendation for saturated fat
          }; // fallback

          const guidelines = getPediatricGuidelines(kid.age);
          const avgCalories = (guidelines.caloriesMin + guidelines.caloriesMax) / 2;

          // Adjust calories based on activity level
          const adjustedCalories = kid.activityLevel
            ? adjustForActivity(avgCalories, kid.activityLevel)
            : avgCalories;

          // Calculate macro ranges from percentages
          const fatGramsMin = Math.round((adjustedCalories * guidelines.fatPercentMin / 100) / 9);
          const fatGramsMax = Math.round((adjustedCalories * guidelines.fatPercentMax / 100) / 9);
          const carbsGramsMin = Math.round((adjustedCalories * guidelines.carbsPercentMin / 100) / 4);
          const carbsGramsMax = Math.round((adjustedCalories * guidelines.carbsPercentMax / 100) / 4);

          return {
            dailyCalories: adjustedCalories,
            mealCalories: distributeMealCalories(adjustedCalories, enabledMeals),
            protein: { min: guidelines.proteinGrams, max: Math.round(guidelines.proteinGrams * 1.5) },
            fat: { min: fatGramsMin, max: fatGramsMax },
            carbs: { min: carbsGramsMin, max: carbsGramsMax },
            sodium: { max: guidelines.sodiumMaxMg },
            sugar: { max: guidelines.sugarMaxG }, // AAP/AHA recommendation: Age-specific added sugars limit
            saturatedFat: { max: guidelines.saturatedFatMaxG }, // AAP/AHA recommendation: Age-specific saturated fat limit
          };
        }

        const baseGoals = state.sameGoalsForAllKids
          ? state.customGoalsForAllKids
          : state.customGoalsByKidId[kidId] || state.customGoalsForAllKids;

        if (state.nutritionScope === "per_day") {
          const perMeal =
            enabledMeals.length > 0
              ? Math.round(baseGoals.dailyCalories / enabledMeals.length)
              : 0;

          const mealCalories = Object.fromEntries(
            (MEAL_TYPES as readonly MealType[]).map((meal) => [meal, perMeal])
          ) as Record<MealType, number>;

          return {
            dailyCalories: baseGoals.dailyCalories,
            mealCalories,
            protein: baseGoals.protein,
            carbs: baseGoals.carbs,
            fat: baseGoals.fat,
            sodium: baseGoals.sodium || { max: DAILY_GOALS.dailyTotals.sodiumMax },
            sugar: baseGoals.sugar || { max: guidelines.sugarMaxG }, // Age-specific limit
            saturatedFat: baseGoals.saturatedFat || { max: guidelines.saturatedFatMaxG }, // Age-specific limit
          };
        }

        const mealCalories = Object.fromEntries(
          (MEAL_TYPES as readonly MealType[]).map((meal) => [
            meal,
            baseGoals.mealCalories[meal] ?? DAILY_GOALS.mealCalories[meal],
          ])
        ) as Record<MealType, number>;

        const dailyCalories = enabledMeals.reduce(
          (sum, meal) => sum + (mealCalories[meal] || 0),
          0
        );

        return {
          dailyCalories,
          mealCalories,
          protein: baseGoals.protein,
          carbs: baseGoals.carbs,
          fat: baseGoals.fat,
          sodium: baseGoals.sodium || { max: DAILY_GOALS.dailyTotals.sodiumMax },
          sugar: baseGoals.sugar || { max: guidelines.sugarMaxG }, // Age-specific limit
          saturatedFat: baseGoals.saturatedFat || { max: guidelines.saturatedFatMaxG }, // Age-specific limit
        };
      },

      getMealCaloriesTarget: (kidId, meal) => {
        const targets = get().getTargetsForKid(kidId);
        return targets.mealCalories[meal] ?? 0;
      },

      hydrateFromServer: async () => {
        try {
          const res = await fetch("/api/settings");
          if (!res.ok) return;
          const data = await res.json();
          if (!data) return;
          const { familyId: _f, updatedAt: _u, ...settings } = data;
          set(settings);
        } catch {
          // Offline — keep localStorage state
        }
      },

      syncToServer: async () => {
        const state = get();
        const body = {
          enabledMeals: state.enabledMeals,
          kids: state.kids,
          milkFood: state.milkFood,
          nutritionMode: state.nutritionMode,
          nutritionScope: state.nutritionScope,
          sameGoalsForAllKids: state.sameGoalsForAllKids,
          customGoalsByKidId: state.customGoalsByKidId,
          customGoalsForAllKids: state.customGoalsForAllKids,
        };
        try {
          await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        } catch {
          // Offline — localStorage already cached via persist middleware
        }
      },
    }),
    {
      name: "app-settings",
      version: 1,
    }
  )
);
