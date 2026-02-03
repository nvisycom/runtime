# @nvisy/runtime

Graph definition, DAG compiler, and execution engine for the Nvisy platform.

Parses JSON graph definitions into an immutable execution plan, then runs it —
walking the DAG in topological order with Effect-based concurrency, rate
limiting, retry policies, and runtime observability (metrics + OTel traces).
