import { CronJob } from 'cron';
import { distributeWeeklyRewards } from '../services/rewardService';
import { broadcastToAll } from '../websocket';

let weeklyJob: CronJob | null = null;

export const startWeeklyResetJob = (): void => {
  // Runs every Monday at 00:00:00 UTC
  weeklyJob = new CronJob(
    '0 0 0 * * 1',
    async () => {
      console.log('[CRON] Weekly leaderboard reset triggered');
      try {
        const result = await distributeWeeklyRewards();

        // Broadcast week reset to all connected clients
        broadcastToAll({
          type: 'WEEK_RESET',
          payload: {
            previousWeek: {
              totalPool: result.totalPool,
              distributions: result.distributions.slice(0, 10), // Top 10 for broadcast
              distributedAt: result.distributedAt,
            },
            message: 'New week has begun! Leaderboard has been reset.',
          },
        });

        console.log(`[CRON] Weekly reset complete. Distributed $${result.totalPool.toFixed(2)}`);
      } catch (err) {
        console.error('[CRON] Weekly reset failed:', err);
      }
    },
    null,
    true,
    'UTC'
  );

  console.log('[CRON] Weekly reset job scheduled (every Monday 00:00 UTC)');
  console.log('[CRON] Next run:', weeklyJob.nextDate().toISO());
};

export const stopWeeklyResetJob = (): void => {
  if (weeklyJob) {
    weeklyJob.stop();
    weeklyJob = null;
    console.log('[CRON] Weekly reset job stopped');
  }
};
