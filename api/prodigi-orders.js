import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables - prefer process.env for Vercel deployment
const envVars = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  WAVESPEED_API_KEY: process.env.WAVESPEED_API_KEY,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  PRODIGI_API_KEY: process.env.PRODIGI_API_KEY,
  PRODIGI_SANDBOX: process.env.PRODIGI_SANDBOX === 'true'
};

// Fallback to .env.local for local development
if (!envVars.GEMINI_API_KEY || !envVars.WAVESPEED_API_KEY) {
  try {
    const envPath = path.join(path.dirname(__dirname), '.env.local');
    const envContent = await fs.readFile(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value && !envVars[key]) {
        envVars[key] = value;
      }
    });
  } catch (error) {
    console.warn('Could not load .env.local file:', error.message);
  }
}

// Prodigi API configuration
const PRODIGI_BASE_URL = envVars.PRODIGI_SANDBOX
  ? 'https://api.sandbox.prodigi.com/v4.0'
  : 'https://api.prodigi.com/v4.0';

// Available print products
const PRINT_PRODUCTS = {
  'canvas-8x10': {
    sku: 'GLOBAL-CAN-8X10',
    name: '8" x 10" Canvas Print',
    description: 'Premium canvas print, gallery wrapped',
    price: 2499, // in cents
    currency: 'USD'
  },
  'canvas-12x16': {
    sku: 'GLOBAL-CAN-12X16',
    name: '12" x 16" Canvas Print',
    description: 'Premium canvas print, gallery wrapped',
    price: 3999,
    currency: 'USD'
  },
  'print-8x10': {
    sku: 'GLOBAL-PHO-8X10',
    name: '8" x 10" Photo Print',
    description: 'High-quality photo print on premium paper',
    price: 899,
    currency: 'USD'
  },
  'print-12x16': {
    sku: 'GLOBAL-PHO-12X16',
    name: '12" x 16" Photo Print',
    description: 'High-quality photo print on premium paper',
    price: 1499,
    currency: 'USD'
  }
};

async function createProdigiOrder(orderData) {
  try {
    console.log('🛒 Creating Prodigi order...');

    if (!envVars.PRODIGI_API_KEY) {
      throw new Error('Prodigi API key not configured');
    }

    const orderPayload = {
      merchantReference: `omoide-${Date.now()}`,
      shippingMethod: 1, // Standard shipping
      recipient: {
        name: orderData.recipient.name,
        email: orderData.recipient.email,
        address: {
          line1: orderData.recipient.address.line1,
          line2: orderData.recipient.address.line2 || '',
          postalOrZipCode: orderData.recipient.address.postalCode,
          countryCode: orderData.recipient.address.countryCode,
          townOrCity: orderData.recipient.address.city,
          stateOrCounty: orderData.recipient.address.state || ''
        }
      },
      items: orderData.items.map(item => ({
        merchantReference: `item-${item.imageIndex}`,
        sku: item.productSku,
        copies: item.quantity,
        sizing: 'fillPrintArea',
        assets: [
          {
            printArea: 'default',
            url: item.imageUrl
          }
        ]
      }))
    };

    const response = await fetch(`${PRODIGI_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': envVars.PRODIGI_API_KEY
      },
      body: JSON.stringify(orderPayload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Prodigi API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    const result = await response.json();

    console.log(`✅ Prodigi order created: ${result.orderId}`);

    return {
      success: true,
      orderId: result.orderId,
      status: result.status,
      total: result.charges?.totalCost,
      currency: result.charges?.currency,
      estimatedShipping: result.shipments?.[0]?.fulfillmentDate
    };

  } catch (error) {
    console.error('❌ Prodigi order creation failed:', error);
    throw error;
  }
}

async function getOrderQuote(quoteData) {
  try {
    console.log('💰 Getting Prodigi quote...');

    if (!envVars.PRODIGI_API_KEY) {
      throw new Error('Prodigi API key not configured');
    }

    const quotePayload = {
      shippingMethod: 1,
      destinationCountryCode: quoteData.countryCode,
      items: quoteData.items.map(item => ({
        sku: item.productSku,
        copies: item.quantity
      }))
    };

    const response = await fetch(`${PRODIGI_BASE_URL}/orders/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': envVars.PRODIGI_API_KEY
      },
      body: JSON.stringify(quotePayload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Prodigi quote error: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    const result = await response.json();

    return {
      success: true,
      subtotal: result.charges?.items,
      shipping: result.charges?.shipping,
      tax: result.charges?.tax,
      total: result.charges?.totalCost,
      currency: result.charges?.currency
    };

  } catch (error) {
    console.error('❌ Prodigi quote failed:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { action, ...data } = req.body;

    switch (action) {
      case 'get-products':
        // Return available print products
        return res.status(200).json({
          success: true,
          products: PRINT_PRODUCTS
        });

      case 'get-quote':
        // Get price quote for items
        const quote = await getOrderQuote(data);
        return res.status(200).json(quote);

      case 'create-order':
        // Create actual print order
        const order = await createProdigiOrder(data);
        return res.status(200).json(order);

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use: get-products, get-quote, or create-order'
        });
    }

  } catch (error) {
    console.error('=== PRODIGI API ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('=== END ERROR ===');

    return res.status(500).json({
      success: false,
      message: 'Print order service unavailable',
      error: error.message
    });
  }
}