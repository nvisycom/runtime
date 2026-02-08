/**
 * @module @nvisy/plugin-nosql
 *
 * NoSQL database plugin for the Nvisy runtime.
 *
 * Provides source and target streams for document databases
 * (MongoDB, DynamoDB, Firestore).
 */

import { Plugin } from "@nvisy/core";

/** NoSQL database plugin instance. */
export const nosqlPlugin = Plugin.define("nosql");
