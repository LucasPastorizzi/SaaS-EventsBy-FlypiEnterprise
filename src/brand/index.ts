// Marca ativa do site, escolhida pela variável NEXT_PUBLIC_BRAND
// ("inn" é o padrão; "movve" para a versão da MOVVE). Cada marca vira um
// deploy separado, com o mesmo código.
import { inn } from "./inn";
import { movve } from "./movve";
import type { BrandConfig, BrandId } from "./types";

const BRANDS: Record<BrandId, BrandConfig> = { inn, movve };

const id = (process.env.NEXT_PUBLIC_BRAND ?? "inn") as BrandId;

export const BRAND: BrandConfig = BRANDS[id] ?? inn;
export type { BrandConfig, BrandId };
