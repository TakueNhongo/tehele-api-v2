export const whatsappResponseFormatPreset = {
  simple: {
    type: 'json_schema',
    json_schema: {
      name: 'whatsapp_message',
      description: null,
      schema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['text', 'image', 'audio', 'video', 'document'],
            description: 'The type of message being sent.',
          },
          text: {
            type: 'object',
            properties: {
              body: {
                type: 'string',
                description: 'The content of the text message.',
              },
            },
            required: ['body'],
            description:
              "The text message object (required if 'type' is 'text').",
          },
          image: {
            type: 'object',
            properties: {
              link: {
                type: 'string',
                description: 'URL of the image to send.',
              },
              caption: {
                type: 'string',
                description: 'Optional caption for the image.',
              },
            },
            required: ['link'],
            description:
              "The image message object (required if 'type' is 'image').",
          },
          audio: {
            type: 'object',
            properties: {
              link: {
                type: 'string',
                description: 'URL of the audio file to send.',
              },
            },
            required: ['link'],
            description:
              "The audio message object (required if 'type' is 'audio').",
          },
          video: {
            type: 'object',
            properties: {
              link: {
                type: 'string',
                description: 'URL of the video to send.',
              },
              caption: {
                type: 'string',
                description: 'Optional caption for the video.',
              },
            },
            required: ['link'],
            description:
              "The video message object (required if 'type' is 'video').",
          },
          document: {
            type: 'object',
            properties: {
              link: {
                type: 'string',
                description: 'URL of the document to send.',
              },
              caption: {
                type: 'string',
                description: 'Optional caption for the document.',
              },
            },
            required: ['link'],
            description:
              "The document message object (required if 'type' is 'document').",
          },
        },
        required: ['type'],
        description: 'Schema for sending a message using WhatsApp Cloud API.',
      },
      strict: false,
    },
  },
};
