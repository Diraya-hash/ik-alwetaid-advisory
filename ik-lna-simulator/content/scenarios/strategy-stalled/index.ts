import type { Scenario } from "@/engine/types";
import { decisions } from "./decisions";
import { evidence, meta, stakeholders } from "./discovery";

export const strategyStalled: Scenario = { ...meta, evidence, stakeholders, ...decisions };
