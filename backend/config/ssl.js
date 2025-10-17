/**
 * SSL/TLS Configuration untuk Absenta System
 * Konfigurasi sertifikat SSL dan HTTPS settings
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SSL Configuration
 * Mendukung berbagai jenis sertifikat SSL
 */
export const sslConfig = {
  // Production SSL settings
  production: {
    // Let's Encrypt certificates
    letsEncrypt: {
      key: process.env.SSL_KEY_PATH || '/etc/letsencrypt/live/absenta.example.com/privkey.pem',
      cert: process.env.SSL_CERT_PATH || '/etc/letsencrypt/live/absenta.example.com/fullchain.pem',
      ca: process.env.SSL_CA_PATH || '/etc/letsencrypt/live/absenta.example.com/chain.pem'
    },
    
    // Custom certificates
    custom: {
      key: process.env.CUSTOM_SSL_KEY_PATH,
      cert: process.env.CUSTOM_SSL_CERT_PATH,
      ca: process.env.CUSTOM_SSL_CA_PATH
    },
    
    // SSL options
    options: {
      secureProtocol: 'TLSv1_2_method',
      ciphers: [
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-SHA384',
        'ECDHE-RSA-AES128-SHA256',
        'ECDHE-RSA-AES256-SHA',
        'ECDHE-RSA-AES128-SHA',
        'DHE-RSA-AES256-GCM-SHA384',
        'DHE-RSA-AES128-GCM-SHA256',
        'DHE-RSA-AES256-SHA256',
        'DHE-RSA-AES128-SHA256',
        'DHE-RSA-AES256-SHA',
        'DHE-RSA-AES128-SHA'
      ].join(':'),
      honorCipherOrder: true,
      secureOptions: require('constants').SSL_OP_NO_SSLv2 | require('constants').SSL_OP_NO_SSLv3
    }
  },
  
  // Development SSL settings (self-signed)
  development: {
    key: path.join(__dirname, '../certs/development-key.pem'),
    cert: path.join(__dirname, '../certs/development-cert.pem')
  }
};

/**
 * Generate self-signed certificate untuk development
 */
export const generateSelfSignedCert = () => {
  const { execSync } = require('child_process');
  const certsDir = path.join(__dirname, '../certs');
  
  // Create certs directory if not exists
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }
  
  const keyPath = path.join(certsDir, 'development-key.pem');
  const certPath = path.join(certsDir, 'development-cert.pem');
  
  // Generate self-signed certificate
  try {
    execSync(`openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=ID/ST=Jakarta/L=Jakarta/O=Absenta/OU=IT/CN=localhost"`, {
      stdio: 'inherit'
    });
    
    console.log('✅ Self-signed certificate generated for development');
    return { key: keyPath, cert: certPath };
  } catch (error) {
    console.error('❌ Failed to generate self-signed certificate:', error.message);
    return null;
  }
};

/**
 * Load SSL certificates
 */
export const loadSSLCertificates = () => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    // Production SSL
    const sslType = process.env.SSL_TYPE || 'letsEncrypt';
    const config = sslConfig.production[sslType];
    
    if (!config) {
      throw new Error(`SSL configuration not found for type: ${sslType}`);
    }
    
    // Check if certificate files exist
    const requiredFiles = [config.key, config.cert];
    if (config.ca) requiredFiles.push(config.ca);
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`SSL certificate file not found: ${file}`);
      }
    }
    
    return {
      key: fs.readFileSync(config.key),
      cert: fs.readFileSync(config.cert),
      ca: config.ca ? fs.readFileSync(config.ca) : undefined,
      ...sslConfig.production.options
    };
  } else {
    // Development SSL
    const devConfig = sslConfig.development;
    
    // Generate self-signed certificate if not exists
    if (!fs.existsSync(devConfig.key) || !fs.existsSync(devConfig.cert)) {
      const generated = generateSelfSignedCert();
      if (generated) {
        return {
          key: fs.readFileSync(generated.key),
          cert: fs.readFileSync(generated.cert)
        };
      }
    }
    
    if (fs.existsSync(devConfig.key) && fs.existsSync(devConfig.cert)) {
      return {
        key: fs.readFileSync(devConfig.key),
        cert: fs.readFileSync(devConfig.cert)
      };
    }
    
    return null;
  }
};

/**
 * SSL Certificate Validation
 */
export const validateSSLCertificate = (certPath) => {
  try {
    const { execSync } = require('child_process');
    const result = execSync(`openssl x509 -in "${certPath}" -text -noout`, { encoding: 'utf8' });
    
    // Parse certificate info
    const subjectMatch = result.match(/Subject: (.+)/);
    const issuerMatch = result.match(/Issuer: (.+)/);
    const notBeforeMatch = result.match(/Not Before: (.+)/);
    const notAfterMatch = result.match(/Not After: (.+)/);
    
    return {
      valid: true,
      subject: subjectMatch ? subjectMatch[1] : null,
      issuer: issuerMatch ? issuerMatch[1] : null,
      notBefore: notBeforeMatch ? notBeforeMatch[1] : null,
      notAfter: notAfterMatch ? notAfterMatch[1] : null
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
};

/**
 * SSL Certificate Renewal Check
 */
export const checkCertificateExpiry = (certPath) => {
  try {
    const { execSync } = require('child_process');
    const result = execSync(`openssl x509 -in "${certPath}" -checkend 2592000 -noout`, { encoding: 'utf8' });
    
    return {
      expiresSoon: false,
      message: 'Certificate is valid for more than 30 days'
    };
  } catch (error) {
    return {
      expiresSoon: true,
      message: 'Certificate expires within 30 days or is invalid'
    };
  }
};

/**
 * HTTPS Server Configuration
 */
export const httpsConfig = {
  // SSL/TLS settings
  ssl: {
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.3',
    ciphers: [
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES256-SHA384',
      'ECDHE-RSA-AES128-SHA256'
    ].join(':'),
    honorCipherOrder: true
  },
  
  // Security headers
  headers: {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  },
  
  // Redirect settings
  redirect: {
    httpToHttps: true,
    wwwToNonWww: true,
    trailingSlash: false
  }
};

export default {
  sslConfig,
  loadSSLCertificates,
  validateSSLCertificate,
  checkCertificateExpiry,
  httpsConfig,
  generateSelfSignedCert
};
