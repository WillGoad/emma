module.exports = async () => {
    const { stopScheduler } = await import('../services/scheduler');
    stopScheduler(); // Stop any lingering cron jobs
  };