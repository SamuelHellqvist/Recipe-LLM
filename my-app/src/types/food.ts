// this file to only defines data types.

export type Ingredient = {
  nummer: number;
  namn: string | null;

  viktForeTillagning?: number | null;
  viktEfterTillagning?: number | null;

  vattenFaktor?: number | null;
  fettFaktor?: number | null;
  tillagningsfaktor?: string | null;
};

export type FoodLink = {
  href: string;
  rel: string;
  method: string;
};

export type Food = {
  nummer: number;
  namn: string;

  livsmedelsTypId?: number;
  livsmedelsTyp?: string;

  tillagningsmetod?: string;
  projekt?: string;
  version?: string;
  vetenskapligtNamn?: string;

  links?: FoodLink[];
};

export type Dish = Food & {
  ingredients: Ingredient[];
};
