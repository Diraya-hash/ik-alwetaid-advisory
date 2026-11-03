import type { Scenario } from "@/engine/types";
import { decisions } from "./decisions";
import { evidence, meta, stakeholders } from "./discovery";

export const quietTeam: Scenario = { ...meta, evidence, stakeholders, ...decisions };
