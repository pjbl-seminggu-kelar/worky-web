import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { createPushupCamera } from "@/lib/pushup/camera";
import { initialCameraStatus } from "@/lib/pushup/status";
import type { RepEvent } from "@/lib/pushup/streaming-fsm";
import type { Prediction } from "@/lib/pushup/model";

type Options = {
  enabled: boolean;
  exerciseKey: string;
  counting: () => boolean;
  video: RefObject<HTMLVideoElement | null>;
  canvas: RefObject<HTMLCanvasElement | null>;
  onRep: (event: RepEvent, prediction: Prediction) => void;
  onPartial: () => void;
};
export function usePushupCamera(options: Options) {
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });
  const [status, setStatus] = useState(initialCameraStatus);
  const [skeleton, setSkeleton] = useState(true);
  const skeletonRef = useRef(true);
  const [nonce, setNonce] = useState(0);
  const runtime = useRef<ReturnType<typeof createPushupCamera> | null>(null);
  const { enabled, exerciseKey, video, canvas } = options;
  useEffect(() => {
    if (!enabled || !video.current || !canvas.current) return;
    let cancelled = false;
    setStatus(initialCameraStatus());
    void import("@/lib/pushup/camera")
      .then(({ createPushupCamera }) => {
        if (cancelled) return;
        const instance = createPushupCamera({
          video: video.current!,
          canvas: canvas.current!,
          counting: () => latest.current.counting(),
          skeleton: () => skeletonRef.current,
          publish: (value) => {
            if (!cancelled) setStatus(value);
          },
          onRep: (event, prediction) => latest.current.onRep(event, prediction),
          onPartial: () => latest.current.onPartial(),
        });
        runtime.current = instance;
        void instance.start();
      })
      .catch((error) => {
        if (!cancelled)
          setStatus({ ...initialCameraStatus(), phase: "error", error: String(error) });
      });
    return () => {
      cancelled = true;
      runtime.current?.close();
      runtime.current = null;
    };
  }, [enabled, exerciseKey, nonce, video, canvas]);
  const calibrate = useCallback(() => runtime.current?.calibrate(), []);
  const resetMovement = useCallback(() => runtime.current?.resetMovement(), []);
  const retry = useCallback(() => setNonce((value) => value + 1), []);
  const toggleSkeleton = useCallback(() => {
    skeletonRef.current = !skeletonRef.current;
    setSkeleton(skeletonRef.current);
    runtime.current?.redraw();
  }, []);
  return { status, skeleton, toggleSkeleton, calibrate, resetMovement, retry };
}
