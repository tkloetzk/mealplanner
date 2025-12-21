import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MEAL_TYPES } from "@/constants";
import type { MealType } from "@/types/shared";
import { DAILY_GOALS } from "@/constants/meal-goals";

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
};

export type KidSettings = {
  id: string;
  name: string;
  age: number;
};

type AppSettingsState = {
  enabledMeals: MealType[];
  kids: KidSettings[];

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

  getEnabledMeals: () => MealType[];
  getTargetsForKid: (kidId: string) => {
    dailyCalories: number;
    mealCalories: Record<MealType, number>;
    protein: MacroRange;
    carbs: MacroRange;
    fat: MacroRange;
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
        { id: "1", name: "Presley", age: 5 },
        { id: "2", name: "Evy", age: 3 },
      ],

      nutritionMode: "recommended",
      nutritionScope: "per_meal",
      sameGoalsForAllKids: false,

      customGoalsByKidId: {},
      customGoalsForAllKids: defaultCustomGoals(),

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
        set({ kids: [...get().kids, { id, name: "", age: 0 }] });
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
        const enabledMeals = get().getEnabledMeals();

        if (get().nutritionMode === "recommended") {
          return {
            dailyCalories: DAILY_GOALS.dailyTotals.calories,
            mealCalories: DAILY_GOALS.mealCalories as Record<MealType, number>,
            protein: DAILY_GOALS.dailyTotals.protein,
            carbs: { min: 0, max: 0 },
            fat: DAILY_GOALS.dailyTotals.fat,
          };
        }

        const baseGoals = get().sameGoalsForAllKids
          ? get().customGoalsForAllKids
          : get().customGoalsByKidId[kidId] || get().customGoalsForAllKids;

        if (get().nutritionScope === "per_day") {
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
        };
      },

      getMealCaloriesTarget: (kidId, meal) => {
        const targets = get().getTargetsForKid(kidId);
        return targets.mealCalories[meal] ?? 0;
      },
    }),
    {
      name: "app-settings",
      version: 1,
    }
  )
);
