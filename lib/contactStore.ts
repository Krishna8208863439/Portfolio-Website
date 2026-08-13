export interface ContactMsg {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  createdAt: string;
}

// Global in-memory array to persist across hot-reloads in node dev process
const globalForMessages = global as unknown as {
  inMemoryMessages: ContactMsg[] | undefined;
};

export const inMemoryMessages: ContactMsg[] = globalForMessages.inMemoryMessages || [
  {
    id: 'msg-1',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@nexustech.com',
    phone: '+1 (555) 234-5678',
    subject: 'Senior Developer Position Inquiry',
    message: 'Hi Krishna, we loved your portfolio! We are currently hiring for a Senior Full Stack & AI Developer role at NexusTech. Would you be available for a quick chat this week?',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'msg-2',
    name: 'Michael Vance',
    email: 'michael@apexventures.io',
    phone: '+1 (555) 987-6543',
    subject: 'Freelance AI Consulting Project',
    message: 'Hello Krishna! I saw your work on autonomous AI agents and computer vision platforms. We are looking for an AI consultant to help build our startup MVP.',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

if (process.env.NODE_ENV !== 'production') {
  globalForMessages.inMemoryMessages = inMemoryMessages;
}

export function addContactMessage(msg: Omit<ContactMsg, 'id' | 'createdAt'>) {
  const newMsg: ContactMsg = {
    id: `msg-${Date.now()}`,
    ...msg,
    createdAt: new Date().toISOString(),
  };
  inMemoryMessages.unshift(newMsg);
  return newMsg;
}

export function getContactMessages() {
  return inMemoryMessages;
}

export function deleteContactMessage(id: string) {
  const index = inMemoryMessages.findIndex((m) => m.id === id);
  if (index !== -1) {
    inMemoryMessages.splice(index, 1);
    return true;
  }
  return false;
}
