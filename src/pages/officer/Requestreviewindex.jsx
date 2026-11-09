import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../../api/client";

// Handles "/officer/request" with no id — reached from the sidebar's
// "Request review" item. Opens the oldest request that needs action, or
// falls back to the queue when there is nothing to review.
export default function RequestReviewIndex() {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    api
      .get("/officer/requests", { params: { status: "actionable" } })
      .then(({ data }) => {
        const first = data.requests[0];
        setTarget(first ? `/officer/request/${first.stageId}` : "/officer/queue");
      })
      .catch(() => setTarget("/officer/queue"));
  }, []);

  return target ? <Navigate to={target} replace /> : null;
}
