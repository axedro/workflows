import { ConnectorConfig } from '@flowcraft/shared-types';

export const slackConfig: ConnectorConfig = {
  id: 'slack',
  name: 'Slack',
  description: 'Enviar mensajes y notificaciones a canales de Slack',
  version: '1.0.0',
  category: 'Comunicación',
  icon: '💬',
  inputs: [
    {
      name: 'operation',
      type: 'string',
      required: false,
      default: 'sendMessage',
      enum: ['sendMessage', 'sendToChannel', 'sendToUser', 'replyToThread', 'uploadFile'],
      description: 'Tipo de operación a realizar',
    },
    {
      name: 'channel',
      type: 'string',
      required: false,
      description: 'ID del canal o nombre del canal (ej: #general)',
    },
    {
      name: 'text',
      type: 'string',
      required: false,
      description: 'Texto del mensaje a enviar',
    },
    {
      name: 'userId',
      type: 'string',
      required: false,
      description: 'ID del usuario para mensajes directos',
    },
    {
      name: 'threadTs',
      type: 'string',
      required: false,
      description: 'Timestamp del thread para respuestas',
    },
    {
      name: 'attachments',
      type: 'array',
      required: false,
      description: 'Adjuntos del mensaje (formato Slack)',
    },
    {
      name: 'blocks',
      type: 'array',
      required: false,
      description: 'Bloques del mensaje (formato Slack Block Kit)',
    },
    {
      name: 'file',
      type: 'string',
      required: false,
      description: 'Datos del archivo para subir (base64)',
    },
    {
      name: 'fileName',
      type: 'string',
      required: false,
      description: 'Nombre del archivo a subir',
    },
    {
      name: 'fileType',
      type: 'string',
      required: false,
      description: 'Tipo MIME del archivo',
    },
  ],
  outputs: [
    {
      name: 'success',
      type: 'boolean',
      description: 'Indica si la operación fue exitosa',
    },
    {
      name: 'channel',
      type: 'string',
      description: 'ID del canal donde se envió el mensaje',
    },
    {
      name: 'ts',
      type: 'string',
      description: 'Timestamp del mensaje enviado',
    },
    {
      name: 'message',
      type: 'object',
      description: 'Objeto del mensaje enviado',
    },
    {
      name: 'error',
      type: 'string',
      description: 'Mensaje de error si la operación falló',
    },
  ],
  configSchema: {
    type: 'object',
    required: ['botToken'],
    properties: {
      botToken: {
        type: 'string',
        title: 'Bot Token',
        description: 'Token de autenticación del bot de Slack',
        format: 'password',
      },
      defaultChannel: {
        type: 'string',
        title: 'Canal por defecto',
        description: 'Canal predeterminado para enviar mensajes',
        pattern: '^[#@][a-zA-Z0-9_-]+$',
      },
      username: {
        type: 'string',
        title: 'Nombre de usuario',
        description: 'Nombre de usuario para el bot (opcional)',
      },
      iconUrl: {
        type: 'string',
        title: 'URL del icono',
        description: 'URL del icono del bot (opcional)',
        format: 'uri',
      },
      iconEmoji: {
        type: 'string',
        title: 'Emoji del icono',
        description: 'Emoji para el icono del bot (opcional)',
        pattern: '^:[a-zA-Z0-9_+-]+:$',
      },
      linkNames: {
        type: 'boolean',
        title: 'Enlazar nombres',
        description: 'Convertir nombres de usuario en enlaces',
        default: true,
      },
      unfurlLinks: {
        type: 'boolean',
        title: 'Expandir enlaces',
        description: 'Expandir automáticamente los enlaces',
        default: false,
      },
      unfurlMedia: {
        type: 'boolean',
        title: 'Expandir medios',
        description: 'Expandir automáticamente los medios',
        default: false,
      },
    },
  },
  metadata: {
    author: 'FlowCraft Team',
    website: 'https://slack.com',
    documentation: 'https://api.slack.com/messaging',
    tags: ['slack', 'messaging', 'notifications', 'communication'],
    examples: [
      {
        name: 'Enviar mensaje simple',
        description: 'Enviar un mensaje de texto a un canal',
        inputs: {
          operation: 'sendMessage',
          channel: '#general',
          text: '¡Hola desde FlowCraft!',
        },
        expectedOutputs: {
          success: true,
          channel: 'C1234567890',
          ts: '1234567890.123456',
        },
      },
      {
        name: 'Enviar mensaje con adjuntos',
        description: 'Enviar un mensaje con adjuntos formateados',
        inputs: {
          operation: 'sendMessage',
          channel: '#alerts',
          text: 'Alerta del sistema',
          attachments: [
            {
              fallback: 'Alerta del sistema',
              color: '#ff0000',
              title: 'Error crítico',
              text: 'Se ha detectado un error en el sistema',
              fields: [
                {
                  title: 'Prioridad',
                  value: 'Alta',
                  short: true,
                },
                {
                  title: 'Servicio',
                  value: 'API Gateway',
                  short: true,
                },
              ],
            },
          ],
        },
        expectedOutputs: {
          success: true,
          channel: 'C1234567890',
          ts: '1234567890.123456',
        },
      },
      {
        name: 'Responder a un thread',
        description: 'Responder a un mensaje existente en un thread',
        inputs: {
          operation: 'replyToThread',
          channel: '#support',
          text: 'Estamos trabajando en ello',
          threadTs: '1234567890.123456',
        },
        expectedOutputs: {
          success: true,
          channel: 'C1234567890',
          ts: '1234567890.123457',
        },
      },
    ],
  },
};
