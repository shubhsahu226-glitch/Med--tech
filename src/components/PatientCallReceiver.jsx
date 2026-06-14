import VideoCall from "./VideoCall";
import { useAuth } from "../context/AuthContext";

export const PatientCallReceiver = () => {
  const { user, role } = useAuth();

  if (role !== "patient" || !user?.id) {
    return null;
  }

  return (
    <VideoCall
      myPeerId={`pat_${user.id}`}
      targetPeerId=""
      targetName="Doctor"
      hideIdleUI={true}
      sessionTab="global-receiver"
    />
  );
};

export default PatientCallReceiver;
