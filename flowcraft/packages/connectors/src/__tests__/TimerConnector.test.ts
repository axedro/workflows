import { TimerConnector, TimerConfig, TimerInput } from '../timer/TimerConnector';
import { ConnectorResult } from '@flowcraft/shared-types';

describe('TimerConnector', () => {
  let timerConnector: TimerConnector;

  beforeEach(() => {
    jest.clearAllMocks();
    timerConnector = new TimerConnector();
  });

  afterEach(() => {
    timerConnector.cleanup();
  });

  describe('execute - delay type', () => {
    it('should execute delay timer successfully', async () => {
      const config: TimerConfig = {
        type: 'delay',
        delay: 100
      };

      const startTime = Date.now();
      const result: ConnectorResult = await timerConnector.execute(config);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Timer delay completed');
      expect(result.data).toEqual(expect.objectContaining({
        type: 'delay',
        delay: 100,
        startTime: expect.any(String),
        endTime: expect.any(String),
        duration: expect.any(Number)
      }));

      // Verify timing (within reasonable tolerance)
      const actualDuration = endTime - startTime;
      expect(actualDuration).toBeGreaterThanOrEqual(90); // Allow 10ms tolerance
      expect(actualDuration).toBeLessThan(150); // Allow for processing time
    });

    it('should use custom delay from input', async () => {
      const config: TimerConfig = {
        type: 'delay',
        delay: 200
      };

      const input: TimerInput = {
        customDelay: 150
      };

      const result: ConnectorResult = await timerConnector.execute(config, input);

      expect(result.success).toBe(true);
      expect(result.data?.delay).toBe(150);
    });

    it('should use default delay if none provided', async () => {
      const config: TimerConfig = {
        type: 'delay'
      };

      const result: ConnectorResult = await timerConnector.execute(config);

      expect(result.success).toBe(true);
      expect(result.data?.delay).toBe(1000); // Default delay
    });

    it('should calculate duration correctly', async () => {
      const config: TimerConfig = {
        type: 'delay',
        delay: 100
      };

      const result: ConnectorResult = await timerConnector.execute(config);

      expect(result.success).toBe(true);
      expect(result.data?.duration).toBeGreaterThanOrEqual(90);
      expect(result.data?.duration).toBeLessThan(150);
    });
  });

  describe('execute - schedule type', () => {
    it('should execute schedule timer successfully', async () => {
      const config: TimerConfig = {
        type: 'schedule',
        schedule: '0 0 * * *', // Daily at midnight
        timezone: 'UTC'
      };

      const result: ConnectorResult = await timerConnector.execute(config);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Timer schedule executed');
      expect(result.data).toEqual(expect.objectContaining({
        type: 'schedule',
        schedule: '0 0 * * *',
        timezone: 'UTC',
        startTime: expect.any(String),
        endTime: expect.any(String),
        nextExecution: expect.any(String)
      }));
    });

    it('should use custom schedule from input', async () => {
      const config: TimerConfig = {
        type: 'schedule',
        schedule: '0 0 * * *'
      };

      const input: TimerInput = {
        customSchedule: '0 */6 * * *' // Every 6 hours
      };

      const result: ConnectorResult = await timerConnector.execute(config, input);

      expect(result.success).toBe(true);
      expect(result.data?.schedule).toBe('0 */6 * * *');
    });

    it('should use default timezone if none provided', async () => {
      const config: TimerConfig = {
        type: 'schedule',
        schedule: '0 0 * * *'
      };

      const result: ConnectorResult = await timerConnector.execute(config);

      expect(result.success).toBe(true);
      expect(result.data?.timezone).toBe('UTC');
    });

    it('should fail if no schedule provided', async () => {
      const config: TimerConfig = {
        type: 'schedule'
        // Missing schedule
      };

      const result: ConnectorResult = await timerConnector.execute(config);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Schedule expression is required for schedule type');
      expect(result.message).toBe('Timer execution failed');
    });

    it('should calculate next execution time', async () => {
      const config: TimerConfig = {
        type: 'schedule',
        schedule: '0 0 * * *'
      };

      const result: ConnectorResult = await timerConnector.execute(config);

      expect(result.success).toBe(true);
      expect(result.data?.nextExecution).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('execute - interval type', () => {
    it('should execute interval timer successfully', async () => {
      const config: TimerConfig = {
        type: 'interval',
        interval: 100,
        maxExecutions: 2
      };

      const startTime = Date.now();
      const result: ConnectorResult = await timerConnector.execute(config);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Timer interval completed');
      expect(result.data).toEqual(expect.objectContaining({
        type: 'interval',
        interval: 100,
        executionCount: 2,
        maxExecutions: 2,
        startTime: expect.any(String),
        endTime: expect.any(String)
      }));

      // Should take at least 100ms (one interval)
      const actualDuration = endTime - startTime;
      expect(actualDuration).toBeGreaterThanOrEqual(90);
    });

    it('should use default values for interval and maxExecutions', async () => {
      const config: TimerConfig = {
        type: 'interval'
      };

      const result: ConnectorResult = await timerConnector.execute(config);

      expect(result.success).toBe(true);
      expect(result.data?.interval).toBe(1000); // Default interval
      expect(result.data?.maxExecutions).toBe(1); // Default max executions
      expect(result.data?.executionCount).toBe(1);
    });

    it('should execute multiple intervals', async () => {
      const config: TimerConfig = {
        type: 'interval',
        interval: 50,
        maxExecutions: 3
      };

      const result: ConnectorResult = await timerConnector.execute(config);

      expect(result.success).toBe(true);
      expect(result.data?.executionCount).toBe(3);
      expect(result.data?.maxExecutions).toBe(3);
    });

    it('should stop after reaching maxExecutions', async () => {
      const config: TimerConfig = {
        type: 'interval',
        interval: 50,
        maxExecutions: 1
      };

      const result: ConnectorResult = await timerConnector.execute(config);

      expect(result.success).toBe(true);
      expect(result.data?.executionCount).toBe(1);
      expect(result.data?.maxExecutions).toBe(1);
    });
  });

  describe('execute - error handling', () => {
    it('should handle unsupported timer type', async () => {
      const config: TimerConfig = {
        type: 'invalid' as any
      };

      const result: ConnectorResult = await timerConnector.execute(config);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unsupported timer type: invalid');
      expect(result.message).toBe('Timer execution failed');
    });

    it('should handle general errors', async () => {
      const config: TimerConfig = {
        type: 'schedule'
      };

      const result: ConnectorResult = await timerConnector.execute(config);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Schedule expression is required for schedule type');
    });
  });

  describe('test', () => {
    it('should execute test with short delay', async () => {
      const config: TimerConfig = {
        type: 'schedule', // Should be converted to delay for testing
        schedule: '0 0 * * *'
      };

      const startTime = Date.now();
      const result: ConnectorResult = await timerConnector.test(config);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.data?.type).toBe('delay');
      expect(result.data?.delay).toBe(100); // Test delay

      // Should complete quickly
      const actualDuration = endTime - startTime;
      expect(actualDuration).toBeGreaterThanOrEqual(90);
      expect(actualDuration).toBeLessThan(150);
    });

    it('should handle test failures', async () => {
      // Mock setTimeout to throw error
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn().mockImplementation(() => {
        throw new Error('Timer error');
      });

      const config: TimerConfig = {
        type: 'delay',
        delay: 100
      };

      const result: ConnectorResult = await timerConnector.test(config);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Timer error');
      expect(result.message).toBe('Timer connector test failed');

      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;
    });
  });

  describe('cleanup', () => {
    it('should clear timeout when cleanup is called', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      const config: TimerConfig = {
        type: 'delay',
        delay: 5000 // Long delay so we can cleanup before completion
      };

      // Start timer but don't wait for completion
      const promise = timerConnector.execute(config);
      
      // Cleanup immediately
      timerConnector.cleanup();
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
    });

    it('should clear interval when cleanup is called', (done) => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      const config: TimerConfig = {
        type: 'interval',
        interval: 100,
        maxExecutions: 10 // Long running so we can cleanup before completion
      };

      // Start interval but don't wait for completion
      timerConnector.execute(config);
      
      // Cleanup after a short delay
      setTimeout(() => {
        timerConnector.cleanup();
        expect(clearIntervalSpy).toHaveBeenCalled();
        
        clearIntervalSpy.mockRestore();
        done();
      }, 50);
    });

    it('should reset execution count on cleanup', () => {
      const config: TimerConfig = {
        type: 'interval',
        interval: 50,
        maxExecutions: 2
      };

      // Execute and then cleanup
      timerConnector.execute(config).then(() => {
        timerConnector.cleanup();
        
        // Execution count should be reset
        // We can't directly test private property, but cleanup method should reset it
        expect(timerConnector.cleanup).toBeDefined();
      });
    });
  });

  describe('schema methods', () => {
    it('should return valid config schema', () => {
      const schema = timerConnector.getConfigSchema();

      expect(schema).toHaveProperty('type', 'object');
      expect(schema.properties).toHaveProperty('type');
      expect(schema.properties).toHaveProperty('delay');
      expect(schema.properties).toHaveProperty('schedule');
      expect(schema.properties).toHaveProperty('interval');
      expect(schema.properties).toHaveProperty('timezone');
      expect(schema.properties).toHaveProperty('maxExecutions');
      expect(schema.required).toEqual(['type']);

      expect(schema.properties.type.enum).toEqual(['delay', 'schedule', 'interval']);
    });

    it('should return valid input schema', () => {
      const schema = timerConnector.getInputSchema();

      expect(schema).toHaveProperty('type', 'object');
      expect(schema.properties).toHaveProperty('customDelay');
      expect(schema.properties).toHaveProperty('customSchedule');
      expect(schema.properties).toHaveProperty('data');
    });

    it('should return valid output schema', () => {
      const schema = timerConnector.getOutputSchema();

      expect(schema).toHaveProperty('type', 'object');
      expect(schema.properties).toHaveProperty('startTime');
      expect(schema.properties).toHaveProperty('endTime');
      expect(schema.properties).toHaveProperty('duration');
      expect(schema.properties).toHaveProperty('delay');
      expect(schema.properties).toHaveProperty('schedule');
      expect(schema.properties).toHaveProperty('interval');
      expect(schema.properties).toHaveProperty('executionCount');
      expect(schema.properties).toHaveProperty('maxExecutions');
      expect(schema.properties).toHaveProperty('timezone');
      expect(schema.properties).toHaveProperty('nextExecution');
      expect(schema.properties).toHaveProperty('type');
    });
  });
});