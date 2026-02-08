/**
 * @module @nvisy/plugin-queue
 *
 * Message queue plugin for the Nvisy runtime.
 *
 * Provides source and target streams for message queue systems
 * (Kafka, RabbitMQ, SQS, Redis Streams).
 */

import { Plugin } from "@nvisy/core";

/** Message queue plugin instance. */
export const queuePlugin = Plugin.define("queue");
