import { Navigate } from "react-router-dom";
import { pendingRequests } from "../../data/mockOfficerRequests";

// Handles "/officer/request" with no id attached — reached when the
// officer clicks "Request review" directly in the sidebar, where
// there's no specific student in context yet. Sends them to the
// first pending request for now.
//
// TODO: once there's a "last opened request" concept (or the queue
// is sorted by urgency), redirect there instead of always picking
// pendingRequests[0].
export default function RequestReviewIndex() {
  const firstId = pendingRequests[0]?.id;
  return firstId ? (
    <Navigate to={`/officer/request/${firstId}`} replace />
  ) : (
    <Navigate to="/officer/queue" replace />
  );
}