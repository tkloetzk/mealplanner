"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MEAL_TYPES, MEAL_TYPE_LABELS } from "@/constants";
import type { MealType } from "@/types/shared";
import { useAppSettingsStore } from "@/store/useAppSettingsStore";
import { getPediatricGuidelines, getAgeGroup } from "@/constants/pediatric-nutrition-guidelines";
import { adjustForActivity } from "@/utils/nutritionUtils";
import { useState, useEffect, useRef } from "react";

const numberValue = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export default function SettingsPage() {
  const enabledMeals = useAppSettingsStore((s) => s.enabledMeals);
  const kids = useAppSettingsStore((s) => s.kids);
  const nutritionMode = useAppSettingsStore((s) => s.nutritionMode);
  const nutritionScope = useAppSettingsStore((s) => s.nutritionScope);
  const sameGoalsForAllKids = useAppSettingsStore((s) => s.sameGoalsForAllKids);

  const setMealEnabled = useAppSettingsStore((s) => s.setMealEnabled);
  const addKid = useAppSettingsStore((s) => s.addKid);
  const updateKid = useAppSettingsStore((s) => s.updateKid);
  const removeKid = useAppSettingsStore((s) => s.removeKid);

  const setNutritionMode = useAppSettingsStore((s) => s.setNutritionMode);
  const setNutritionScope = useAppSettingsStore((s) => s.setNutritionScope);
  const setSameGoalsForAllKids = useAppSettingsStore(
    (s) => s.setSameGoalsForAllKids
  );

  const customGoalsForAllKids = useAppSettingsStore(
    (s) => s.customGoalsForAllKids
  );
  const setCustomGoalsForAllKids = useAppSettingsStore(
    (s) => s.setCustomGoalsForAllKids
  );

  const customGoalsByKidId = useAppSettingsStore((s) => s.customGoalsByKidId);
  const setCustomGoalsForKid = useAppSettingsStore(
    (s) => s.setCustomGoalsForKid
  );

  const getEnabledMeals = useAppSettingsStore((s) => s.getEnabledMeals);
  const milkFood = useAppSettingsStore((s) => s.milkFood);
  const setMilkFood = useAppSettingsStore((s) => s.setMilkFood);
  const resetMilkFood = useAppSettingsStore((s) => s.resetMilkFood);

  const [editingMilk, setEditingMilk] = useState(false);
  const [milkDraft, setMilkDraft] = useState(milkFood);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (savedTimer.current) clearTimeout(savedTimer.current);
    setSaved(true);
    savedTimer.current = setTimeout(() => setSaved(false), 2000);
  }, [enabledMeals, kids, nutritionMode, nutritionScope, sameGoalsForAllKids, customGoalsForAllKids, customGoalsByKidId, milkFood]);

  const enabledMealsResolved = getEnabledMeals();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Settings</h1>
              {saved && (
                <span className="text-sm font-medium text-green-600 transition-opacity">
                  ✓ Saved
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Configure meals, kids, and nutrition targets.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/">Back to Planner</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Meals to Display</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(MEAL_TYPES as readonly MealType[]).map((meal) => {
                const checked = enabledMeals.includes(meal);
                return (
                  <label
                    key={meal}
                    className="flex items-center gap-3 rounded-md border p-3 bg-white"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) =>
                        setMealEnabled(meal, Boolean(value))
                      }
                    />
                    <span className="text-sm font-medium">
                      {MEAL_TYPE_LABELS[meal] ?? meal}
                    </span>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kids</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {kids.map((kid) => (
                <div
                  key={kid.id}
                  className="rounded-md border p-4 bg-white space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Name</div>
                      <Input
                        value={kid.name}
                        onChange={(e) =>
                          updateKid(kid.id, { name: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm font-medium">Age</div>
                      <Input
                        inputMode="numeric"
                        type="number"
                        value={kid.age}
                        onChange={(e) =>
                          updateKid(kid.id, {
                            age: numberValue(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm font-medium">Activity Level</div>
                      <Select
                        value={kid.activityLevel || 'moderate'}
                        onValueChange={(v) =>
                          updateKid(kid.id, { activityLevel: v as 'sedentary' | 'moderate' | 'active' })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select activity level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sedentary">Sedentary</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="destructive"
                        onClick={() => removeKid(kid.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-medium">Dietary Restrictions / Allergies</div>
                    <Input
                      placeholder="e.g. peanut allergy, vegetarian, no shellfish"
                      value={kid.restrictions || ''}
                      onChange={(e) =>
                        updateKid(kid.id, { restrictions: e.target.value })
                      }
                    />
                  </div>

                  {nutritionMode === "custom" && !sameGoalsForAllKids && (
                    <>
                      <KidGoalsEditor
                        kidId={kid.id}
                        mealTypes={enabledMealsResolved}
                        scope={nutritionScope}
                        goals={
                          customGoalsByKidId[kid.id] ?? customGoalsForAllKids
                        }
                        onChange={(next) => setCustomGoalsForKid(kid.id, next)}
                      />
                      <div className="flex justify-end pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const goals =
                              customGoalsByKidId[kid.id] ??
                              customGoalsForAllKids;
                            kids.forEach((k) => {
                              if (k.id !== kid.id) {
                                setCustomGoalsForKid(k.id, goals);
                              }
                            });
                          }}
                        >
                          Apply to Other Kids
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={addKid}>
              Add Kid
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Milk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!editingMilk ? (
              <div className="flex items-center justify-between rounded-md border p-4 bg-white">
                <div>
                  <div className="font-medium">{milkFood.name}</div>
                  <div className="text-sm text-gray-600">
                    {milkFood.calories} kcal &middot; {milkFood.protein}g protein &middot; {milkFood.carbs}g carbs &middot; {milkFood.fat}g fat
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMilkDraft(milkFood);
                      setEditingMilk(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetMilkFood}>
                    Reset
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-md border p-4 bg-white space-y-3">
                <div className="text-sm font-semibold">Edit Milk Food</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Name</div>
                    <Input
                      value={milkDraft.name}
                      onChange={(e) =>
                        setMilkDraft({ ...milkDraft, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Calories</div>
                    <Input
                      inputMode="numeric"
                      type="number"
                      value={milkDraft.calories}
                      onChange={(e) =>
                        setMilkDraft({
                          ...milkDraft,
                          calories: numberValue(e.target.value),
                          adjustedCalories: numberValue(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Protein (g)</div>
                    <Input
                      inputMode="numeric"
                      type="number"
                      value={milkDraft.protein}
                      onChange={(e) =>
                        setMilkDraft({
                          ...milkDraft,
                          protein: numberValue(e.target.value),
                          adjustedProtein: numberValue(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Carbs (g)</div>
                    <Input
                      inputMode="numeric"
                      type="number"
                      value={milkDraft.carbs}
                      onChange={(e) =>
                        setMilkDraft({
                          ...milkDraft,
                          carbs: numberValue(e.target.value),
                          adjustedCarbs: numberValue(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Fat (g)</div>
                    <Input
                      inputMode="numeric"
                      type="number"
                      value={milkDraft.fat}
                      onChange={(e) =>
                        setMilkDraft({
                          ...milkDraft,
                          fat: numberValue(e.target.value),
                          adjustedFat: numberValue(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingMilk(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setMilkFood(milkDraft);
                      setEditingMilk(false);
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nutrition Targets</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              You can switch between recommended and custom modes at any time.
              Your custom settings are saved.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">Mode</div>
                <Select
                  value={nutritionMode}
                  onValueChange={(v) =>
                    setNutritionMode(v as "recommended" | "custom")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommended">Recommended</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Custom Scope</div>
                <Select
                  value={nutritionScope}
                  onValueChange={(v) =>
                    setNutritionScope(v as "per_day" | "per_meal")
                  }
                  disabled={nutritionMode !== "custom"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_day">Per Day</SelectItem>
                    <SelectItem value="per_meal">Per Meal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Apply to</div>
                <label className="flex items-center gap-3 rounded-md border p-3 bg-white">
                  <Checkbox
                    checked={sameGoalsForAllKids}
                    onCheckedChange={(value) =>
                      setSameGoalsForAllKids(Boolean(value))
                    }
                    disabled={nutritionMode !== "custom"}
                  />
                  <span className="text-sm">Same goals for all kids</span>
                </label>
              </div>
            </div>

            {nutritionMode === "custom" && (
              <div className="space-y-4">
                {sameGoalsForAllKids && (
                  <div className="rounded-md border p-4 bg-white space-y-3">
                    <div className="text-sm font-semibold">
                      Custom Goals (All Kids)
                    </div>
                    <KidGoalsEditor
                      kidId="all"
                      mealTypes={enabledMealsResolved}
                      scope={nutritionScope}
                      goals={customGoalsForAllKids}
                      onChange={setCustomGoalsForAllKids}
                    />
                    <div className="flex justify-end pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          kids.forEach((k) => {
                            setCustomGoalsForKid(k.id, customGoalsForAllKids);
                          });
                        }}
                      >
                        Copy to Individual Kid Settings
                      </Button>
                    </div>
                  </div>
                )}

                {!sameGoalsForAllKids && kids.length === 0 && (
                  <div className="text-sm text-gray-600">
                    Add a kid to configure per-kid custom goals.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {nutritionMode === "recommended" && (
          <Card>
            <CardHeader>
              <CardTitle>Age-Based Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {kids.map(kid => {
                  const guidelines = getPediatricGuidelines(kid.age);
                  const ageGroup = getAgeGroup(kid.age);
                  const avgCalories = (guidelines.caloriesMin + guidelines.caloriesMax) / 2;
                  const adjustedCalories = kid.activityLevel
                    ? adjustForActivity(avgCalories, kid.activityLevel)
                    : avgCalories;
                  return (
                    <div key={kid.id} className="rounded-md border p-4 bg-blue-50">
                      <div className="font-semibold">{kid.name} (Age {kid.age})</div>
                      <div className="text-sm text-gray-700 mt-2">
                        <div>Age Group: {ageGroup} years</div>
                        <div>Activity Level: {kid.activityLevel || 'moderate'}</div>
                        <div>Calories: {adjustedCalories} kcal/day (base: {guidelines.caloriesMin}-{guidelines.caloriesMax})</div>
                        <div>Protein: {guidelines.proteinGrams}g/day minimum</div>
                        <div>Fat: {guidelines.fatPercentMin}-{guidelines.fatPercentMax}% of calories</div>
                        <div>Sodium: &lt;{guidelines.sodiumMaxMg}mg/day</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

type CustomGoals = ReturnType<
  typeof useAppSettingsStore.getState
>["customGoalsForAllKids"];

type MacroKey = "protein" | "carbs" | "fat";

function KidGoalsEditor({
  kidId,
  mealTypes,
  scope,
  goals,
  onChange,
}: {
  kidId: string;
  mealTypes: MealType[];
  scope: "per_day" | "per_meal";
  goals: CustomGoals;
  onChange: (goals: CustomGoals) => void;
}) {
  const updateMacro = (key: MacroKey, field: "min" | "max", value: number) => {
    onChange({
      ...goals,
      [key]: { ...goals[key], [field]: value },
    });
  };

  return (
    <div className="space-y-4">
      {scope === "per_day" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-sm font-medium">Daily Calories</div>
            <Input
              inputMode="numeric"
              type="number"
              value={goals.dailyCalories}
              onChange={(e) =>
                onChange({
                  ...goals,
                  dailyCalories: numberValue(e.target.value),
                })
              }
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-sm font-medium">Meal Calories</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mealTypes.map((meal) => (
              <div key={`${kidId}-${meal}`} className="space-y-1">
                <div className="text-xs text-gray-600">
                  {MEAL_TYPE_LABELS[meal] ?? meal}
                </div>
                <Input
                  inputMode="numeric"
                  type="number"
                  value={goals.mealCalories[meal] ?? 0}
                  onChange={(e) =>
                    onChange({
                      ...goals,
                      mealCalories: {
                        ...goals.mealCalories,
                        [meal]: numberValue(e.target.value),
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(["protein", "carbs", "fat"] as const).map((key) => (
          <div
            key={`${kidId}-${key}`}
            className="rounded-md border p-3 bg-white"
          >
            <div className="text-sm font-medium mb-2">
              {key.charAt(0).toUpperCase() + key.slice(1)} (g)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="text-xs text-gray-600">Min</div>
                <Input
                  inputMode="numeric"
                  type="number"
                  value={goals[key].min}
                  onChange={(e) =>
                    updateMacro(key, "min", numberValue(e.target.value))
                  }
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-600">Max</div>
                <Input
                  inputMode="numeric"
                  type="number"
                  value={goals[key].max}
                  onChange={(e) =>
                    updateMacro(key, "max", numberValue(e.target.value))
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
