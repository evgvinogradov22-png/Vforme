const sanitizeHtml = require('sanitize-html');

const ALLOWED = {
  allowedTags: ['b', 'i', 'u', 's', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li', 'h2', 'h3', 'a', 'img', 'blockquote'],
  allowedAttributes: {
    'a': ['href', 'target', 'rel'],
    'img': ['src', 'alt', 'style'],
    '*': ['style'],
  },
  allowedStyles: {
    '*': {
      'color': [/.*/],
      'background-color': [/.*/],
      'text-align': [/.*/],
      'font-weight': [/.*/],
      'font-size': [/.*/],
    }
  },
  // Запрещаем опасные атрибуты
  disallowedTagsMode: 'discard',
};

module.exports = (dirty) => {
  if (!dirty || typeof dirty !== 'string') return dirty;
  return sanitizeHtml(dirty, ALLOWED);
};
