/** Direct port of pushup_core/pushup_core/streaming_fsm.py (FSM v2).
 * Invalid angles are observations of missing data, never previous angles.
 * Gap events are emitted on the NEXT valid observation, as in Python.
 */
export const FSM_CONFIG = {
  trigger_drop: 12,
  return_margin: 12,
  min_rebound: 12,
  min_cycle_s: 0.25,
  max_missing_s: 0.2,
} as const;
export type RepEvent = {
  start_time: number;
  bottom_time: number;
  end_time: number | null;
  top_angle: number;
  min_angle: number;
  status: "active" | "completed" | "partial_gap" | "partial_end";
  rom?: number;
};
export class StatefulRepCounter {
  state: "TOP" | "ACTIVE" = "TOP";
  top_angle: number | null = null;
  top_time: number | null = null;
  rep: RepEvent | null = null;
  last_valid_t: number | null = null;
  last_timestamp: number | null = null;
  events: RepEvent[] = [];
  reset() {
    this.state = "TOP";
    this.top_angle = null;
    this.top_time = null;
    this.rep = null;
    this.last_valid_t = null;
    this.last_timestamp = null;
    this.events = [];
  }
  update(t: number, angle: number | null): RepEvent[] {
    // Browser guard for malformed timestamps. Python parity is tested on finite timestamps.
    if (!Number.isFinite(t)) throw new Error("Timestamp must be finite.");
    if (this.last_timestamp !== null && t < this.last_timestamp)
      throw new Error("Timestamps must be chronological.");
    this.last_timestamp = t;
    const emitted: RepEvent[] = [];
    if (angle === null || !Number.isFinite(angle)) return emitted;
    if (this.last_valid_t !== null && t - this.last_valid_t > FSM_CONFIG.max_missing_s) {
      if (this.state === "ACTIVE" && this.rep !== null) {
        const partial: RepEvent = {
          ...this.rep,
          status: "partial_gap",
          end_time: this.last_valid_t,
        };
        emitted.push(partial);
        this.events.push(partial);
      }
      this.state = "TOP";
      this.top_angle = null;
      this.top_time = null;
      this.rep = null;
    }
    this.last_valid_t = t;
    if (this.state === "TOP") {
      if (this.top_angle === null || angle > this.top_angle) {
        this.top_angle = angle;
        this.top_time = t;
      }
      if (this.top_angle - angle >= FSM_CONFIG.trigger_drop) {
        this.state = "ACTIVE";
        this.rep = {
          start_time: this.top_time!,
          bottom_time: t,
          end_time: null,
          top_angle: this.top_angle,
          min_angle: angle,
          status: "active",
        };
      }
    } else if (this.rep) {
      if (angle < this.rep.min_angle) {
        this.rep.min_angle = angle;
        this.rep.bottom_time = t;
      }
      const duration = t - this.rep.start_time,
        rebound = angle - this.rep.min_angle;
      const returned =
        angle >= this.rep.top_angle - FSM_CONFIG.return_margin && rebound >= FSM_CONFIG.min_rebound;
      if (returned && duration >= FSM_CONFIG.min_cycle_s) {
        const completed: RepEvent = {
          ...this.rep,
          end_time: t,
          status: "completed",
          rom: this.rep.top_angle - this.rep.min_angle,
        };
        emitted.push(completed);
        this.events.push(completed);
        this.rep = null;
        this.state = "TOP";
        this.top_angle = angle;
        this.top_time = t;
      }
    }
    return emitted;
  }
  finish(): RepEvent[] {
    if (this.state === "ACTIVE" && this.rep) {
      const partial: RepEvent = {
        ...this.rep,
        status: "partial_end",
        end_time: this.last_timestamp,
        rom: this.rep.top_angle - this.rep.min_angle,
      };
      this.events.push(partial);
      this.rep = null;
      this.state = "TOP";
      return [partial];
    }
    return [];
  }
}

export type RepSnapshot = {
  count: number;
  state: "TOP" | "ACTIVE";
  lastEvent: RepEvent | null;
  lastCompleted: RepEvent | null;
};
/** Small camera-session adapter: gates the FSM until calibration and counts completed only. */
export class LiveRepSession {
  readonly counter = new StatefulRepCounter();
  private enabled = false;
  private count = 0;
  private lastEvent: RepEvent | null = null;
  private lastCompleted: RepEvent | null = null;
  get snapshot(): RepSnapshot {
    return {
      count: this.count,
      state: this.counter.state,
      lastEvent: this.lastEvent,
      lastCompleted: this.lastCompleted,
    };
  }
  private consume(events: RepEvent[]) {
    for (const event of events) {
      this.lastEvent = event;
      if (event.status === "completed") {
        this.count++;
        this.lastCompleted = event;
      }
    }
    return this.snapshot;
  }
  update(t: number, angle: number | null, calibrated: boolean) {
    if (!calibrated) return this.snapshot;
    if (!this.enabled) {
      this.counter.reset();
      this.enabled = true;
    }
    return this.consume(this.counter.update(t, angle));
  }
  reset() {
    this.counter.reset();
    this.enabled = false;
    this.count = 0;
    this.lastEvent = null;
    this.lastCompleted = null;
    return this.snapshot;
  }
  finish() {
    const result = this.consume(this.counter.finish());
    this.enabled = false;
    return result;
  }
}
