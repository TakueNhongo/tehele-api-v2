export interface DashboardData {
  user: {
    name: string;
    email: string;
  };
  stats: {
    title: string;
    value: string;
    icon: string;
    trend?: number;
    description?: string;
  }[];
  fundingData: {
    month: string;
    amount: number;
  }[];
  quickActions: {
    icon: string;
    label: string;
    color: string;
  }[];
  messages: {
    sender: {
      name: string;
      avatar: string;
    };
    content: string;
    time: string;
  }[];
  events: {
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    type: 'conference' | 'meeting' | 'workshop';
  }[];
  articles: {
    title: string;
    category: string;
    excerpt: string;
    author: {
      name: string;
      avatar: string;
    };
    readTime: number;
    publishedAt: string;
  }[];
}
