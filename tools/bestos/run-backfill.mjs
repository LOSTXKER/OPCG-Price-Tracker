#!/usr/bin/env node
// BestOS owns delivery; every managed run keeps independently checked report evidence.
import os from "node:os";
import path from "node:path";
import { runBusinessWrapper } from "./job-quality.mjs";
const HERE = path.dirname(new URL(import.meta.url).pathname);
const STATE = path.join(os.homedir(), ".cache", "bestos-meecard-snkrdunk-backfill", "last-summary.json");
runBusinessWrapper({ job: "meecard-snkrdunk-backfill", producer: path.join(HERE, "meecard-snkrdunk-backfill.mjs"), stateFile: STATE, argv: process.argv.slice(2) });
