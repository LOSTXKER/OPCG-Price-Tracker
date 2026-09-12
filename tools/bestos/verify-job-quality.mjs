#!/usr/bin/env node
import fs from 'node:fs';
import { verifyJobQuality } from './job-quality.mjs';

try { console.log(JSON.stringify(verifyJobQuality(fs.readFileSync(0, 'utf8')))); }
catch (error) { console.log(JSON.stringify({ pass: false, reason: String(error.message).slice(0, 300) })); }
