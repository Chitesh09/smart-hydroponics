'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

// Unified Sensor Reading Interface
export interface SensorReading {
  waterLevel: number;
  distance: number;
  ph: number;
  tds: number;
  timestamp: number;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected';

// Explicit type interface for browser-level Web Serial port
interface SerialPort {
  readable: {
    pipeTo(writable: WritableStream<string>): Promise<void>;
  };
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
}

interface ESP32SerialContextType {
  supported: boolean;
  mode: 'real' | 'simulation';
  connectionState: ConnectionState;
  isStale: boolean;
  latestReading: SensorReading | null;
  lastUpdateTime: number | null;
  history: SensorReading[];
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setMode: (mode: 'real' | 'simulation') => void;
}

const ESP32SerialContext = createContext<ESP32SerialContextType | undefined>(undefined);

export function ESP32SerialProvider({ children }: { children: React.ReactNode }) {
  const [supported, setSupported] = useState(false);
  const [mode, setModeState] = useState<'real' | 'simulation'>('simulation');
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [error, setError] = useState<string | null>(null);

  // References to keep track of serial port and stream reader
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const keepReadingRef = useRef(false);
  
  // Track timestamps for freshness in a ref to avoid stale closure in loops
  const lastUpdateRef = useRef<number | null>(null);

  // 1. Detect Web Serial support on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serial' in navigator) {
      setSupported(true);
    }
  }, []);

  // Seed initial rolling history buffer on mount
  useEffect(() => {
    const initialHistory: SensorReading[] = [];
    const now = Date.now();
    for (let i = 59; i >= 0; i--) {
      const time = now - i * 2000;
      initialHistory.push({
        ph: parseFloat((6.0 + Math.sin(i * 0.2) * 0.1 + Math.random() * 0.05).toFixed(2)),
        tds: parseFloat((1000 - i * 2 + Math.random() * 10).toFixed(1)),
        waterLevel: parseFloat((85.0 - i * 0.05).toFixed(1)),
        distance: parseFloat((100.0 - ((85.0 - i * 0.05) * 0.9)).toFixed(2)),
        timestamp: time
      });
    }
    setHistory(initialHistory);
  }, []);

  // 2. Refreshness check (Runs every second in the background)
  useEffect(() => {
    const freshnessInterval = setInterval(() => {
      if (connectionState === 'connected' && lastUpdateRef.current) {
        const timeDiff = Date.now() - lastUpdateRef.current;
        if (timeDiff > 3000) {
          setIsStale(true);
        } else {
          setIsStale(false);
        }
      }
    }, 1000);

    return () => clearInterval(freshnessInterval);
  }, [connectionState]);

  // 3. Simulated polling loop (Active only when mode is 'simulation')
  useEffect(() => {
    if (mode !== 'simulation') return;

    const pollSimulator = async () => {
      try {
        const res = await fetch('/api/simulate');
        if (res.ok) {
          const sys = await res.json();
          if (sys.reading) {
            const reading: SensorReading = {
              waterLevel: sys.reading.waterLevel,
              // Map simulated water level (0-100%) to mock distance (10-100cm)
              distance: parseFloat((100.0 - (sys.reading.waterLevel * 0.9)).toFixed(2)),
              ph: sys.reading.ph,
              tds: sys.reading.tds,
              timestamp: Date.now(),
            };

            setLatestReading(reading);
            setLastUpdateTime(Date.now());
            lastUpdateRef.current = Date.now();
            setIsStale(false);
            setError(null);

            setHistory((prev) => {
              const updated = [...prev, reading];
              return updated.slice(-60); // Bounded rolling history
            });
          }
        }
      } catch (_err) {
        setError('Failed to poll simulator data');
      }
    };

    pollSimulator(); // Initial poll
    const interval = setInterval(pollSimulator, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [mode]);

  // 4. Connect to real ESP32 via Web Serial
  const connect = async () => {
    if (!supported) {
      setError('Web Serial API is not supported in this browser. Please use Chrome, Edge, or Opera.');
      return;
    }

    try {
      setError(null);
      setConnectionState('connecting');

      // Request port selection from user without using 'any'
      const navigatorWithSerial = navigator as unknown as {
        serial: {
          requestPort(): Promise<SerialPort>;
        };
      };
      const port = await navigatorWithSerial.serial.requestPort();
      portRef.current = port;

      // Open port at 115200 baud
      await port.open({ baudRate: 115200 });
      setConnectionState('connected');
      setModeState('real'); // Switch mode to real hardware automatically
      setIsStale(false);

      // Start continuous read stream
      keepReadingRef.current = true;
      readSerialLoop(port).catch((err) => {
        console.error('[ESP32 Web Serial] Read loop error:', err);
      });
    } catch (err: unknown) {
      setConnectionState('disconnected');
      const errObject = err as Error;
      if (errObject.name === 'NotFoundError' || errObject.message?.includes('user cancelled')) {
        setError('Connection cancelled by user.');
      } else {
        setError(`Failed to open serial port: ${errObject.message || String(err)}`);
      }
      console.error('[ESP32 Web Serial] Connection error:', err);
    }
  };

  // 5. Direct Serial Read Loop with Line Buffering
  const readSerialLoop = async (port: SerialPort) => {
    let decoder: TextDecoderStream | null = null;
    let inputClosed: Promise<void> | null = null;
    let buffer = '';

    try {
      decoder = new TextDecoderStream();
      inputClosed = port.readable.pipeTo(decoder.writable as unknown as WritableStream<string>);
      const reader = decoder.readable.getReader();
      readerRef.current = reader;

      console.log('[ESP32 Web Serial] Reader loop active');

      while (keepReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) {
          console.log('[ESP32 Web Serial] Reader stream done');
          break;
        }

        if (value) {
          buffer += value;
          
          // Split buffer by newline separator
          const lines = buffer.split('\n');
          // The last element is either an incomplete line or empty string
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed) {
              try {
                const parsed = JSON.parse(trimmed) as Record<string, unknown>;
                
                // Validate fields: waterLevel, distance, ph, tds
                if (
                  typeof parsed.waterLevel === 'number' &&
                  typeof parsed.distance === 'number' &&
                  typeof parsed.ph === 'number' &&
                  typeof parsed.tds === 'number'
                ) {
                  const reading: SensorReading = {
                    waterLevel: parsed.waterLevel,
                    distance: parsed.distance,
                    ph: parsed.ph,
                    tds: parsed.tds,
                    timestamp: Date.now(),
                  };

                  setLatestReading(reading);
                  setLastUpdateTime(Date.now());
                  lastUpdateRef.current = Date.now();
                  setIsStale(false);
                  setError(null);

                  setHistory((prev) => {
                    const updated = [...prev, reading];
                    return updated.slice(-60); // Bounded rolling history
                  });
                } else {
                  console.warn('[ESP32 Web Serial] Parsed object missing expected properties:', parsed);
                }
              } catch (_parseErr) {
                // Ignore malformed JSON chunks gracefully
                console.warn('[ESP32 Web Serial] Ignored malformed JSON line:', trimmed);
              }
            }
          }
        }
      }
    } catch (err: unknown) {
      const errObject = err as Error;
      console.error('[ESP32 Web Serial] Read loop crashed:', err);
      setError(`Serial stream error: ${errObject.message || String(err)}`);
    } finally {
      // Clean up readable streams
      if (readerRef.current) {
        try {
          await readerRef.current.cancel();
          readerRef.current.releaseLock();
        } catch (_e) {}
        readerRef.current = null;
      }

      if (inputClosed) {
        try {
          await inputClosed.catch(() => {});
        } catch (_e) {}
      }

      setConnectionState('disconnected');
      setIsStale(true);
      console.log('[ESP32 Web Serial] Reader loop terminated');
    }
  };

  // 6. Clean disconnect
  const disconnect = async () => {
    console.log('[ESP32 Web Serial] Disconnecting...');
    keepReadingRef.current = false;

    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (_e) {}
    }

    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch (_e) {}
      portRef.current = null;
    }

    setConnectionState('disconnected');
    setIsStale(true);
    setModeState('simulation'); // Fallback to simulation mode after disconnect
  };

  // Handle manual mode changes (e.g. toggling back to simulation when disconnected)
  const setMode = (targetMode: 'real' | 'simulation') => {
    if (targetMode === 'real' && connectionState !== 'connected') {
      setError('Cannot switch to real mode without an active ESP32 connection.');
      return;
    }
    setModeState(targetMode);
  };

  // Auto clean-up on provider unmount
  useEffect(() => {
    return () => {
      keepReadingRef.current = false;
      if (portRef.current) {
        try {
          portRef.current.close();
        } catch (_e) {}
      }
    };
  }, []);

  return (
    <ESP32SerialContext.Provider
      value={{
        supported,
        mode,
        connectionState,
        isStale,
        latestReading,
        lastUpdateTime,
        history,
        error,
        connect,
        disconnect,
        setMode,
      }}
    >
      {children}
    </ESP32SerialContext.Provider>
  );
}

export function useESP32Serial() {
  const context = useContext(ESP32SerialContext);
  if (context === undefined) {
    throw new Error('useESP32Serial must be used within an ESP32SerialProvider');
  }
  return context;
}
