import os from "os";

// A name for this server process. Every response carries it in the
// X-Served-By header, so you can watch the load balancer spread requests
// across servers (and cluster workers).
export const INSTANCE_ID =
  process.env.INSTANCE_ID || `${os.hostname()}:${process.env.PORT || 5000}:${process.pid}`;

export const STARTED_AT = new Date();
