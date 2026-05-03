import { useEffect, useState } from "react";
import WebPushManager from "@/services/webpush";

export default function useUserIsSubscribed(): boolean {
  const [subscribed, setSubscribed] = useState(false);
  useEffect(() => {
    let mounted = true;
    WebPushManager.isSubscribed().then((value) => {
      if (mounted) setSubscribed(value);
    });
    return () => {
      mounted = false;
    };
  }, []);
  return subscribed;
}
