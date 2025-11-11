const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

let cachedClient;

const getClient = () => {
  if (!cachedClient) {
    cachedClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });
  }
  return cachedClient;
};

const shouldMock = () => {
  if (process.env.USE_MOCK_SNS === 'true') {
    return true;
  }

  const requiredEnv = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
  return !requiredEnv.every(name => process.env[name]);
};

const sendReminder = async ({ subject, message, phoneNumber, topicArn }) => {
  if (!message) {
    throw new Error('A message body is required to publish an SNS notification');
  }

  if (!phoneNumber && !topicArn) {
    throw new Error('Provide either phoneNumber or topicArn to route the notification');
  }

  if (shouldMock()) {
    console.log('SNS mock mode enabled. Skipping publish.', { subject, message, phoneNumber, topicArn });
    return { mock: true };
  }

  const params = { Message: message };

  if (subject) {
    params.Subject = subject;
  }

  if (topicArn) {
    params.TopicArn = topicArn;
  } else if (phoneNumber) {
    params.PhoneNumber = phoneNumber;
  }

  const command = new PublishCommand(params);
  const client = getClient();
  return client.send(command);
};

module.exports = { sendReminder };
