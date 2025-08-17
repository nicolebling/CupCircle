
export const cronJobs = [
  {
    name: 'coffee-chat-reminders',
    schedule: '*/30 * * * *', // Run every 30 minutes
    functionName: 'scheduled-notifications',
    description: 'Send 3-hour reminder notifications for upcoming coffee chats'
  }
];
