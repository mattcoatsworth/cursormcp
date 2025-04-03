-- Insert WhatsApp MCP Server endpoints
INSERT INTO public.api_endpoints (
    service,
    resource,
    action,
    method,
    path,
    parameters,
    description,
    authentication_type,
    rate_limit,
    metadata
) VALUES
-- Messaging Endpoints
('whatsapp', 'messages', 'send_text', 'POST', '/messages', 
    '{"to": "string", "text": "string", "preview_url": "boolean"}',
    'Send a text message to a WhatsApp user',
    'bearer',
    100,
    '{"category": "messaging", "requires_media": false}'
),
('whatsapp', 'messages', 'send_template', 'POST', '/messages/template',
    '{"to": "string", "template_name": "string", "language_code": "string", "components": "array"}',
    'Send a template message to a WhatsApp user',
    'bearer',
    100,
    '{"category": "messaging", "requires_media": false}'
),
('whatsapp', 'messages', 'send_image', 'POST', '/messages/image',
    '{"to": "string", "image_url": "string", "caption": "string"}',
    'Send an image message to a WhatsApp user',
    'bearer',
    100,
    '{"category": "messaging", "requires_media": true}'
),
('whatsapp', 'messages', 'send_document', 'POST', '/messages/document',
    '{"to": "string", "document_url": "string", "caption": "string"}',
    'Send a document to a WhatsApp user',
    'bearer',
    100,
    '{"category": "messaging", "requires_media": true}'
),
('whatsapp', 'messages', 'send_video', 'POST', '/messages/video',
    '{"to": "string", "video_url": "string", "caption": "string"}',
    'Send a video message to a WhatsApp user',
    'bearer',
    100,
    '{"category": "messaging", "requires_media": true}'
),
('whatsapp', 'messages', 'send_location', 'POST', '/messages/location',
    '{"to": "string", "latitude": "number", "longitude": "number", "name": "string", "address": "string"}',
    'Send a location message to a WhatsApp user',
    'bearer',
    100,
    '{"category": "messaging", "requires_media": false}'
),
('whatsapp', 'messages', 'send_contact', 'POST', '/messages/contact',
    '{"to": "string", "contacts": "array"}',
    'Send contact information to a WhatsApp user',
    'bearer',
    100,
    '{"category": "messaging", "requires_media": false}'
),
('whatsapp', 'messages', 'send_interactive', 'POST', '/messages/interactive',
    '{"to": "string", "type": "string", "interactive": "object"}',
    'Send an interactive message to a WhatsApp user',
    'bearer',
    100,
    '{"category": "messaging", "requires_media": false}'
),
('whatsapp', 'messages', 'mark_read', 'POST', '/messages/read',
    '{"message_id": "string"}',
    'Mark a message as read',
    'bearer',
    100,
    '{"category": "messaging", "requires_media": false}'
),

-- Media Endpoints
('whatsapp', 'media', 'upload', 'POST', '/media',
    '{"file": "file", "type": "string"}',
    'Upload media to WhatsApp servers',
    'bearer',
    100,
    '{"category": "media", "requires_media": true}'
),
('whatsapp', 'media', 'get_url', 'GET', '/media/{media_id}',
    '{"media_id": "string"}',
    'Get the URL for a media file',
    'bearer',
    100,
    '{"category": "media", "requires_media": false}'
),
('whatsapp', 'media', 'delete', 'DELETE', '/media/{media_id}',
    '{"media_id": "string"}',
    'Delete media from WhatsApp servers',
    'bearer',
    100,
    '{"category": "media", "requires_media": false}'
),

-- Template Endpoints
('whatsapp', 'templates', 'list', 'GET', '/templates',
    '{"category": "string"}',
    'Get message templates',
    'bearer',
    100,
    '{"category": "templates", "requires_media": false}'
),
('whatsapp', 'templates', 'create', 'POST', '/templates',
    '{"name": "string", "language": "string", "category": "string", "components": "array"}',
    'Create a message template',
    'bearer',
    100,
    '{"category": "templates", "requires_media": false}'
),

-- Business Profile Endpoints
('whatsapp', 'business', 'get_profile', 'GET', '/business/profile',
    '{}',
    'Get business profile information',
    'bearer',
    100,
    '{"category": "business", "requires_media": false}'
),
('whatsapp', 'business', 'update_profile', 'POST', '/business/profile',
    '{"profile": "object"}',
    'Update business profile',
    'bearer',
    100,
    '{"category": "business", "requires_media": false}'
),

-- Phone Number Endpoints
('whatsapp', 'phone', 'list', 'GET', '/phone-numbers',
    '{}',
    'Get phone numbers',
    'bearer',
    100,
    '{"category": "phone", "requires_media": false}'
),
('whatsapp', 'phone', 'get_details', 'GET', '/phone-numbers/{id}',
    '{"id": "string"}',
    'Get phone number details',
    'bearer',
    100,
    '{"category": "phone", "requires_media": false}'
),
('whatsapp', 'phone', 'request_verification', 'POST', '/phone-numbers/verify',
    '{"phone_number": "string"}',
    'Request verification code',
    'bearer',
    100,
    '{"category": "phone", "requires_media": false}'
),
('whatsapp', 'phone', 'verify_code', 'POST', '/phone-numbers/verify-code',
    '{"code": "string"}',
    'Verify a phone number',
    'bearer',
    100,
    '{"category": "phone", "requires_media": false}'
),

-- Webhook Endpoints
('whatsapp', 'webhooks', 'get_info', 'GET', '/webhooks',
    '{}',
    'Get webhook information',
    'bearer',
    100,
    '{"category": "webhooks", "requires_media": false}'
),
('whatsapp', 'webhooks', 'subscribe', 'POST', '/webhooks',
    '{"url": "string", "events": "array"}',
    'Subscribe to webhooks',
    'bearer',
    100,
    '{"category": "webhooks", "requires_media": false}'
),
('whatsapp', 'webhooks', 'unsubscribe', 'DELETE', '/webhooks',
    '{"subscription_id": "string"}',
    'Delete webhook subscription',
    'bearer',
    100,
    '{"category": "webhooks", "requires_media": false}'
); 