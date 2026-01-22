import React, { useState, useEffect, useCallback } from 'react';
import { PerformanceMonitor } from './performance-utils';

// Benchmark result interface
export interface BenchmarkResult {
  testName: string;
  duration: number; // in milliseconds
  fps: number;
  memoryUsed: number; // in MB
  cpuTime: number; // in milliseconds
  timestamp: number;
  details?: any;
}

// Benchmark configuration
export interface BenchmarkConfig {
  iterations: number;
  warmupRuns: number;
  sampleInterval: number; // ms between samples
  maxRunTime: number; // maximum runtime in ms
}

// Default benchmark configuration
const DEFAULT_BENCHMARK_CONFIG: BenchmarkConfig = {
  iterations: 100,
  warmupRuns: 10,
  sampleInterval: 16, // ~60fps
  maxRunTime: 30000, // 30 seconds max
};

// Benchmark suite class
class BenchmarkSuite {
  private static instance: BenchmarkSuite | null = null;
  private results: BenchmarkResult[] = [];
  private performanceMonitor: PerformanceMonitor;
  private config: BenchmarkConfig;

  private constructor(config: BenchmarkConfig = DEFAULT_BENCHMARK_CONFIG) {
    this.config = config;
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  // Singleton pattern
  static getInstance(config?: BenchmarkConfig): BenchmarkSuite {
    if (!BenchmarkSuite.instance) {
      BenchmarkSuite.instance = new BenchmarkSuite(config);
    }
    return BenchmarkSuite.instance;
  }

  // Run a performance benchmark
  async runBenchmark(
    testName: string,
    testFunction: () => void,
    config: BenchmarkConfig = this.config
  ): Promise<BenchmarkResult> {
    console.log(`Starting benchmark: ${testName}`);

    // Warmup runs
    for (let i = 0; i < config.warmupRuns; i++) {
      testFunction();
    }

    // Start performance monitoring
    const startMemory = this.getMemoryUsage();
    const startTime = performance.now();
    const startTimestamp = Date.now();

    // Run the actual benchmark
    let iterations = 0;
    const startFPSTime = performance.now();
    let frameCount = 0;

    const benchmarkPromise = new Promise<BenchmarkResult>((resolve) => {
      const runIteration = () => {
        if (iterations >= config.iterations ||
            (performance.now() - startTime) > config.maxRunTime) {

          const endTime = performance.now();
          const endMemory = this.getMemoryUsage();

          // Calculate FPS
          const elapsedFPSTime = endTime - startFPSTime;
          const fps = (frameCount / elapsedFPSTime) * 1000;

          const result: BenchmarkResult = {
            testName,
            duration: endTime - startTime,
            fps: isNaN(fps) ? 0 : fps,
            memoryUsed: endMemory - startMemory,
            cpuTime: endTime - startTime,
            timestamp: startTimestamp,
          };

          this.results.push(result);
          console.log(`Benchmark completed: ${testName}`, result);
          resolve(result);
          return;
        }

        // Run the test function
        testFunction();
        frameCount++;
        iterations++;

        // Schedule next iteration
        setTimeout(runIteration, config.sampleInterval);
      };

      runIteration();
    });

    return benchmarkPromise;
  }

  // Run multiple benchmarks
  async runBenchmarks(benchmarks: Array<{name: string, fn: () => void}>): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    for (const benchmark of benchmarks) {
      const result = await this.runBenchmark(benchmark.name, benchmark.fn);
      results.push(result);
    }

    return results;
  }

  // Get all benchmark results
  getResults(): BenchmarkResult[] {
    return [...this.results];
  }

  // Get average FPS across all benchmarks
  getAverageFPS(): number {
    if (this.results.length === 0) return 0;
    const totalFPS = this.results.reduce((sum, result) => sum + result.fps, 0);
    return totalFPS / this.results.length;
  }

  // Get memory usage
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }
    return 0;
  }

  // Clear all results
  clearResults(): void {
    this.results = [];
  }

  // Get benchmark report
  getReport(): string {
    if (this.results.length === 0) {
      return 'No benchmark results available.';
    }

    const totalDuration = this.results.reduce((sum, result) => sum + result.duration, 0);
    const avgDuration = totalDuration / this.results.length;
    const avgFPS = this.getAverageFPS();
    const maxMemory = Math.max(...this.results.map(r => r.memoryUsed));

    return `
Benchmark Report:
=================
Total Tests Run: ${this.results.length}
Average Duration: ${avgDuration.toFixed(2)}ms
Average FPS: ${avgFPS.toFixed(2)}
Peak Memory Used: ${maxMemory.toFixed(2)}MB

Detailed Results:
${this.results.map(r =>
  `  ${r.testName}: ${r.duration.toFixed(2)}ms, ${r.fps.toFixed(2)} FPS`
).join('\n')}
    `;
  }

  // Export results as JSON
  exportResults(): string {
    return JSON.stringify(this.results, null, 2);
  }

  // Import results from JSON
  importResults(json: string): void {
    try {
      const importedResults = JSON.parse(json);
      if (Array.isArray(importedResults)) {
        this.results = importedResults;
      }
    } catch (error) {
      console.error('Error importing benchmark results:', error);
    }
  }
}

// Animation benchmarking utilities
export class AnimationBenchmark {
  // Benchmark a single animation
  static async benchmarkAnimation(
    animationFunction: () => void,
    duration: number = 1000, // ms
    config: BenchmarkConfig = DEFAULT_BENCHMARK_CONFIG
  ): Promise<BenchmarkResult> {
    const suite = BenchmarkSuite.getInstance(config);

    return new Promise((resolve) => {
      let startTime: number;
      let frameCount = 0;

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;

        const elapsed = timestamp - startTime;

        if (elapsed < duration) {
          animationFunction();
          frameCount++;
          requestAnimationFrame(animate);
        } else {
          // Calculate FPS
          const fps = (frameCount / (elapsed / 1000));

          const result: BenchmarkResult = {
            testName: 'Animation Benchmark',
            duration: elapsed,
            fps: isNaN(fps) ? 0 : fps,
            memoryUsed: 0, // Would need memory profiling
            cpuTime: elapsed,
            timestamp: Date.now(),
            details: {
              framesRendered: frameCount,
              targetDuration: duration
            }
          };

          resolve(result);
        }
      };

      requestAnimationFrame(animate);
    });
  }

  // Benchmark animation with different complexity levels
  static async benchmarkAnimationComplexity(
    lowComplexityFn: () => void,
    mediumComplexityFn: () => void,
    highComplexityFn: () => void
  ): Promise<{low: BenchmarkResult, medium: BenchmarkResult, high: BenchmarkResult}> {
    const low = await this.benchmarkAnimation(lowComplexityFn, 1000);
    const medium = await this.benchmarkAnimation(mediumComplexityFn, 1000);
    const high = await this.benchmarkAnimation(highComplexityFn, 1000);

    return { low, medium, high };
  }
}

// React hook for benchmarking
export const useBenchmark = (config?: BenchmarkConfig) => {
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  const benchmarkSuite = BenchmarkSuite.getInstance(config);

  const runBenchmark = useCallback(async (
    testName: string,
    testFunction: () => void
  ): Promise<BenchmarkResult> => {
    setIsRunning(true);
    setCurrentTest(testName);

    try {
      const result = await benchmarkSuite.runBenchmark(testName, testFunction);
      setResults(prev => [...prev, result]);
      return result;
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
    }
  }, []);

  const runBenchmarks = useCallback(async (
    benchmarks: Array<{name: string, fn: () => void}>
  ): Promise<BenchmarkResult[]> => {
    setIsRunning(true);

    try {
      const results = await benchmarkSuite.runBenchmarks(benchmarks);
      setResults(results);
      return results;
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
    }
  }, []);

  const clearResults = useCallback(() => {
    benchmarkSuite.clearResults();
    setResults([]);
  }, []);

  const getReport = useCallback(() => {
    return benchmarkSuite.getReport();
  }, []);

  return {
    results,
    isRunning,
    currentTest,
    runBenchmark,
    runBenchmarks,
    clearResults,
    getReport,
    averageFPS: benchmarkSuite.getAverageFPS(),
  };
};

// Benchmark component for UI
interface BenchmarkComponentProps {
  children: React.ReactNode;
  className?: string;
  showResults?: boolean;
  autoRun?: boolean;
}

export const BenchmarkComponent: React.FC<BenchmarkComponentProps> = ({
  children,
  className = '',
  showResults = true,
  autoRun = false
}) => {
  const { results, isRunning, currentTest, runBenchmark, clearResults, getReport, averageFPS } = useBenchmark();
  const [benchmarkName, setBenchmarkName] = useState<string>('My Benchmark');

  useEffect(() => {
    if (autoRun) {
      const runDefaultBenchmark = async () => {
        await runBenchmark('Auto Benchmark', () => {
          // Perform a simple operation to benchmark
          const arr = new Array(1000).fill(0).map((_, i) => i * 2);
          return arr;
        });
      };

      runDefaultBenchmark();
    }
  }, [autoRun, runBenchmark]);

  const handleRunBenchmark = () => {
    runBenchmark(benchmarkName, () => {
      // Perform a simple operation to benchmark
      const arr = new Array(1000).fill(0).map((_, i) => i * 2);
      return arr;
    });
  };

  return (
    <div className={`benchmark-component ${className}`}>
      <div className="benchmark-controls p-4 bg-gray-100 rounded-lg mb-4">
        <h3 className="text-lg font-semibold mb-2">Performance Benchmark</h3>

        <div className="flex items-center space-x-2 mb-2">
          <input
            type="text"
            value={benchmarkName}
            onChange={(e) => setBenchmarkName(e.target.value)}
            placeholder="Benchmark name"
            className="px-3 py-1 border rounded"
          />
          <button
            onClick={handleRunBenchmark}
            disabled={isRunning}
            className="px-4 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {isRunning ? `Running: ${currentTest}` : 'Run Benchmark'}
          </button>
          <button
            onClick={clearResults}
            className="px-4 py-1 bg-gray-500 text-white rounded"
          >
            Clear
          </button>
        </div>

        <div className="text-sm">
          <div>Average FPS: <span className="font-mono">{averageFPS.toFixed(2)}</span></div>
          <div>Total Tests: <span className="font-mono">{results.length}</span></div>
        </div>
      </div>

      <div className="benchmark-content">
        {children}
      </div>

      {showResults && results.length > 0 && (
        <div className="benchmark-results mt-4 p-4 bg-white border rounded-lg">
          <h4 className="font-medium mb-2">Latest Results</h4>
          <div className="space-y-1 text-sm">
            {results.slice(-5).map((result, index) => (
              <div key={index} className="flex justify-between border-b pb-1">
                <span>{result.testName}</span>
                <span>{result.fps.toFixed(2)} FPS</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Performance monitoring decorator
export function withPerformanceMonitoring<T extends Function>(fn: T, testName?: string): T {
  return ((...args: any[]) => {
    const benchmarkSuite = BenchmarkSuite.getInstance();
    const name = testName || fn.name || 'Anonymous Function';

    return benchmarkSuite.runBenchmark(name, () => fn(...args));
  }) as any as T;
}

// Export the benchmark suite instance
export default BenchmarkSuite.getInstance();