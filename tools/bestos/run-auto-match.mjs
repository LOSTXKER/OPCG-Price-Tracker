#!/usr/bin/env node
// BestOS owns delivery; every managed run keeps independently checked report evidence.
import os from "node:os";
import path from "node:path";
import { runBusinessWrapper } from "./job-quality.mjs";
const HERE = path.dirname(new URL(import.meta.url).pathname);
const STATE = path.join(os.homedir(), ".cache", "bestos-meecard-auto-match", "last-summary.json");
runBusinessWrapper({ job: "meecard-auto-match", producer: path.join(HERE, "meecard-auto-match-supervisor.mjs"), stateFile: STATE, argv: ['--dry-run', ...process.argv.slice(2)] });
