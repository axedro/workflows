import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { BaseConnector } from '../base';
import { ConnectorResult } from '@flowcraft/shared-types';

export interface SlackConnectorConfig {
  botToken: string;
  channelId?: string;
  defaultChannel?: string;
  username?: string;
  iconUrl?: string;
  iconEmoji?: string;
  linkNames?: boolean;
  unfurlLinks?: boolean;
  unfurlMedia?: boolean;
  threadTs?: string;
}

export interface SlackMessage {
  channel: string;
  text: string;
  attachments?: SlackAttachment[];
  blocks?: SlackBlock[];
  threadTs?: string;
  username?: string;
  iconUrl?: string;
  iconEmoji?: string;
  linkNames?: boolean;
  unfurlLinks?: boolean;
  unfurlMedia?: boolean;
}

export interface SlackAttachment {
  fallback: string;
  color?: string;
  pretext?: string;
  authorName?: string;
  authorLink?: string;
  authorIcon?: string;
  title?: string;
  titleLink?: string;
  text?: string;
  fields?: SlackField[];
  imageUrl?: string;
  thumbUrl?: string;
  footer?: string;
  footerIcon?: string;
  ts?: number;
}

export interface SlackField {
  title: string;
  value: string;
  short?: boolean;
}

export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  fields?: SlackField[];
  accessory?: any;
}

export interface SlackResponse {
  ok: boolean;
  channel?: string;
  ts?: string;
  message?: any;
  error?: string;
}

export class SlackConnector extends BaseConnector {
  private client: AxiosInstance;
  private baseUrl = 'https://slack.com/api';

  constructor() {
    super();
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FlowCraft-Slack-Connector/1.0',
      },
    });
  }

  /**
   * Execute Slack operation
   */
  async execute(config: any, input?: any): Promise<ConnectorResult> {
    try {
      const operation = input?.operation || config.operation || 'sendMessage';
      
      switch (operation) {
        case 'sendMessage':
          return await this.sendMessage(config, input);
        case 'sendToChannel':
          return await this.sendToChannel(config, input);
        case 'sendToUser':
          return await this.sendToUser(config, input);
        case 'replyToThread':
          return await this.replyToThread(config, input);
        case 'uploadFile':
          return await this.uploadFile(config, input);
        default:
          return {
            success: false,
            error: `Unknown operation: ${operation}`,
            message: 'Invalid Slack operation',
          };
      }
    } catch (error) {
      const slackError = this.processError(error);
      await this.log(`Slack operation failed: ${slackError.message}`, 'error');
      return {
        success: false,
        error: slackError.message,
        message: 'Slack operation failed',
      };
    }
  }

  /**
   * Test connector configuration
   */
  async test(config: any): Promise<ConnectorResult> {
    try {
      if (!config.botToken) {
        return {
          success: false,
          error: 'Bot token is required',
          message: 'Validation failed: Bot token is required',
        };
      }

      // Test the connection by calling auth.test
      const response = await this.client.post('/auth.test', {}, {
        headers: {
          'Authorization': `Bearer ${config.botToken}`,
        },
      });

      if (response.data.ok) {
        return {
          success: true,
          data: {
            team: response.data.team,
            user: response.data.user,
            userId: response.data.user_id,
            teamId: response.data.team_id,
          },
          message: 'Slack connection test successful',
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Authentication failed',
          message: 'Slack authentication test failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Slack connector test failed',
      };
    }
  }

  /**
   * Send a simple message
   */
  private async sendMessage(config: any, input?: any): Promise<ConnectorResult> {
    const message: SlackMessage = {
      channel: input?.channel || config.defaultChannel || config.channelId,
      text: input?.text || input?.message || config.text,
      threadTs: input?.threadTs || config.threadTs,
      username: input?.username || config.username,
      iconUrl: input?.iconUrl || config.iconUrl,
      iconEmoji: input?.iconEmoji || config.iconEmoji,
      linkNames: input?.linkNames ?? config.linkNames ?? true,
      unfurlLinks: input?.unfurlLinks ?? config.unfurlLinks ?? false,
      unfurlMedia: input?.unfurlMedia ?? config.unfurlMedia ?? false,
    };

    if (!message.channel) {
      return {
        success: false,
        error: 'Channel is required',
        message: 'Validation failed: Channel is required',
      };
    }

    if (!message.text) {
      return {
        success: false,
        error: 'Message text is required',
        message: 'Validation failed: Message text is required',
      };
    }

    // Add attachments if provided
    if (input?.attachments || config.attachments) {
      message.attachments = input?.attachments || config.attachments;
    }

    // Add blocks if provided
    if (input?.blocks || config.blocks) {
      message.blocks = input?.blocks || config.blocks;
    }

    return await this.postMessage(message, config.botToken);
  }

  /**
   * Send message to a specific channel
   */
  private async sendToChannel(config: any, input?: any): Promise<ConnectorResult> {
    const channel = input?.channel || config.channelId;
    if (!channel) {
      return {
        success: false,
        error: 'Channel ID is required',
        message: 'Validation failed: Channel ID is required',
      };
    }

    return await this.sendMessage(config, { ...input, channel });
  }

  /**
   * Send direct message to a user
   */
  private async sendToUser(config: any, input?: any): Promise<ConnectorResult> {
    const userId = input?.userId || input?.user || config.userId;
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        message: 'Validation failed: User ID is required',
      };
    }

    return await this.sendMessage(config, { ...input, channel: `@${userId}` });
  }

  /**
   * Reply to a thread
   */
  private async replyToThread(config: any, input?: any): Promise<ConnectorResult> {
    const threadTs = input?.threadTs || config.threadTs;
    if (!threadTs) {
      return {
        success: false,
        error: 'Thread timestamp is required',
        message: 'Validation failed: Thread timestamp is required',
      };
    }

    return await this.sendMessage(config, { ...input, threadTs });
  }

  /**
   * Upload a file to Slack
   */
  private async uploadFile(config: any, input?: any): Promise<ConnectorResult> {
    try {
      const fileData = input?.file || config.file;
      const fileName = input?.fileName || config.fileName || 'file.txt';
      const fileType = input?.fileType || config.fileType || 'text/plain';
      const channel = input?.channel || config.defaultChannel || config.channelId;
      const title = input?.title || config.title;
      const initialComment = input?.comment || config.comment;

      if (!fileData) {
        return {
          success: false,
          error: 'File data is required',
          message: 'Validation failed: File data is required',
        };
      }

      const formData = new FormData();
      formData.append('file', new Blob([fileData], { type: fileType }), fileName);
      formData.append('channels', channel);
      
      if (title) formData.append('title', title);
      if (initialComment) formData.append('initial_comment', initialComment);

      const response = await this.client.post('/files.upload', formData, {
        headers: {
          'Authorization': `Bearer ${config.botToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.ok) {
        return {
          success: true,
          data: response.data.file,
          message: 'File uploaded successfully',
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Upload failed',
          message: 'File upload failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'File upload failed',
      };
    }
  }

  /**
   * Post message to Slack
   */
  private async postMessage(message: SlackMessage, botToken: string): Promise<ConnectorResult> {
    try {
      const response = await this.client.post('/chat.postMessage', message, {
        headers: {
          'Authorization': `Bearer ${botToken}`,
        },
      });

      if (response.data.ok) {
        return {
          success: true,
          data: {
            channel: response.data.channel,
            ts: response.data.ts,
            message: response.data.message,
          },
          message: 'Message sent successfully',
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Message sending failed',
          message: 'Failed to send message',
        };
      }
    } catch (error) {
      const slackError = this.processError(error);
      return {
        success: false,
        error: slackError.message,
        message: 'Failed to send message',
      };
    }
  }

  /**
   * Process error response
   */
  private processError(error: any): { message: string; status?: number } {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      return {
        message: axiosError.message,
        status: axiosError.response?.status,
      };
    }
    
    return {
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
