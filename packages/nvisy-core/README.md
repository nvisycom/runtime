# @nvisy/core

Shared foundation for the Nvisy Runtime platform.

Defines the primitive type system (Embedding, Document, Blob, Row), the error
taxonomy (ConnectionError, ValidationError, ProcessError, CancelledError), the
Source/Sink/Action interfaces that all connectors implement, and common
utilities (hashing, types, streaming).

Every other package in the monorepo depends on this one.
