// scheduler.ts
import cron from 'node-cron';
import { checkSubscriptions } from './subscriptionService';

type ScheduledTask = {
  name: string;
  schedule: string | cron.ScheduleOptions;
  job: () => Promise<void>;
};

const scheduledTasks: ScheduledTask[] = [
  {
    name: 'subscription-check',
    schedule: '* * * * *', // Every hour at minute 0
    job: checkSubscriptions
  },
  // Add more tasks here
];

export function startScheduler() {
  for (const task of scheduledTasks) {
    cron.schedule(String(task.schedule), async () => {
      console.log(`Starting task: ${task.name}`);
      try {
        await task.job();
        console.log(`Completed task: ${task.name}`);
      } catch (error) {
        console.error(`Error in task ${task.name}:`, error);
      }
    });
  }
  console.log('Scheduler initialized');
}