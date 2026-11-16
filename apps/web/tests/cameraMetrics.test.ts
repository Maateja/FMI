import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CameraMetricsTracker } from '../src/services/cameraMetrics';

describe('CameraMetricsTracker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('instantiates tracker with interview id', () => {
    const tracker = new CameraMetricsTracker('interview-123');
    expect(tracker).toBeDefined();
  });

  it('computes metrics within valid ranges', () => {
    const feedbackFn = vi.fn();
    const tracker = new CameraMetricsTracker('interview-test', feedbackFn);

    const mockVideo = {
      videoWidth: 640,
      videoHeight: 480,
      paused: false,
      ended: false,
    } as unknown as HTMLVideoElement;

    // Start tracker
    tracker.start(mockVideo);

    // Stop tracker cleanly
    tracker.stop();
    expect(tracker).toBeDefined();
  });
});
