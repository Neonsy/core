---
'@fluxerjs/builders': major
'@fluxerjs/core': major
---

Reject embed text outside fixed API bounds and field lists above their fixed limit instead of truncating them.
Validate embed URLs against Fluxer's stable URL syntax and validate runtime input shapes before dispatch.
Leave configured message content, embed count, and account-dependent aggregate checks to the API.
Builder validation errors identify the rejected rule and include supplied and allowed sizes where applicable.
