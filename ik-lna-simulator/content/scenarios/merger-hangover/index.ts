import type { Scenario } from "@/engine/types";
import { decisions } from "./decisions";
import { evidence, meta, stakeholders } from "./discovery";

export const mergerHangover: Scenario = { ...meta, evidence, stakeholders, ...decisions };
