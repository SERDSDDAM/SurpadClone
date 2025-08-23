import { GPSData } from "@/types/survey";

class GPSSimulator {
  private baseLatitude = 15.3547; // Sana'a coordinates
  private baseLongitude = 44.2066;
  private baseElevation = 2180.5;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: ((data: GPSData) => void)[] = [];

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.updatePosition();
    }, 1000); // Update every second
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  onUpdate(callback: (data: GPSData) => void) {
    this.callbacks.push(callback);
  }

  removeCallback(callback: (data: GPSData) => void) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  private updatePosition() {
    // Simulate small movements (±2cm accuracy)
    const latOffset = (Math.random() - 0.5) * 0.0000002; // ~2cm
    const lonOffset = (Math.random() - 0.5) * 0.0000002;
    const elevOffset = (Math.random() - 0.5) * 0.04; // ±2cm elevation

    const gpsData: GPSData = {
      latitude: this.baseLatitude + latOffset,
      longitude: this.baseLongitude + lonOffset,
      elevation: this.baseElevation + elevOffset,
      accuracy: 0.02 + Math.random() * 0.03, // 2-5cm accuracy
      satelliteCount: 10 + Math.floor(Math.random() * 5), // 10-14 satellites
      timestamp: new Date(),
    };

    this.callbacks.forEach(callback => callback(gpsData));
  }

  getCurrentPosition(): Promise<GPSData> {
    return new Promise((resolve) => {
      const latOffset = (Math.random() - 0.5) * 0.0000002;
      const lonOffset = (Math.random() - 0.5) * 0.0000002;
      const elevOffset = (Math.random() - 0.5) * 0.04;

      resolve({
        latitude: this.baseLatitude + latOffset,
        longitude: this.baseLongitude + lonOffset,
        elevation: this.baseElevation + elevOffset,
        accuracy: 0.02 + Math.random() * 0.03,
        satelliteCount: 10 + Math.floor(Math.random() * 5),
        timestamp: new Date(),
      });
    });
  }

  // Simulate high-precision point capture
  capturePoint(): Promise<GPSData> {
    return new Promise((resolve) => {
      // Simulate measurement time
      setTimeout(() => {
        const highPrecisionData: GPSData = {
          latitude: this.baseLatitude + (Math.random() - 0.5) * 0.00000009, // ~1cm
          longitude: this.baseLongitude + (Math.random() - 0.5) * 0.00000009,
          elevation: this.baseElevation + (Math.random() - 0.5) * 0.02,
          accuracy: 0.01 + Math.random() * 0.01, // 1-2cm accuracy
          satelliteCount: 12 + Math.floor(Math.random() * 3),
          timestamp: new Date(),
        };
        resolve(highPrecisionData);
      }, 1500); // 1.5 second measurement time
    });
  }
}

export const gpsSimulator = new GPSSimulator();
