// ==============================================================================
// Speakly_FS — cPanel / Phusion Passenger Entrypoint
// Location: public_html/speakly/api/app.js
// ==============================================================================

// Ensure production environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Load compiled server application
require('./dist/index.js');
