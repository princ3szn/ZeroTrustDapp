// utils/ipfs.js - Hybrid Web3.Storage + Pinata implementation with debugging
import { create } from '@web3-storage/w3up-client';
import { StoreMemory } from '@web3-storage/w3up-client/stores/memory';

// Configuration
const WEB3_STORAGE_EMAIL = import.meta.env?.VITE_WEB3_STORAGE_EMAIL || 
                          (typeof process !== 'undefined' ? process.env?.REACT_APP_WEB3_STORAGE_EMAIL : null);

const PINATA_JWT = import.meta.env?.VITE_PINATA_JWT || 
                  (typeof process !== 'undefined' ? process.env?.REACT_APP_PINATA_JWT : null);

const PINATA_API_KEY = import.meta.env?.VITE_PINATA_API_KEY || 
                      (typeof process !== 'undefined' ? process.env?.REACT_APP_PINATA_API_KEY : null);

const PINATA_SECRET_KEY = import.meta.env?.VITE_PINATA_SECRET_KEY || 
                         (typeof process !== 'undefined' ? process.env?.REACT_APP_PINATA_SECRET_KEY : null);

// Client state
let w3upClient = null;
let isW3upInitialized = false;
let w3upInitializationAttempted = false; // Track if we've already tried to initialize

/**
 * Force reset and re-initialize the Web3.Storage client
 * Call this if you encounter login issues
 */
export const resetW3upClient = async () => {
  console.log('🔄 Resetting Web3.Storage client...');
  w3upClient = null;
  isW3upInitialized = false;
  w3upInitializationAttempted = false;
  
  // Clear any cached credentials if they exist
  try {
    // Force a fresh initialization
    return await initializeW3upClient();
  } catch (error) {
    console.error('Reset failed:', error);
    throw error;
  }
};

/**
 * Initialize W3up client for Web3.Storage - UPDATED to prevent repeated emails
 */
const initializeW3upClient = async () => {
  console.log('🔍 Checking W3up client status:', { 
    isInitialized: isW3upInitialized, 
    hasClient: !!w3upClient,
    attempted: w3upInitializationAttempted,
    email: WEB3_STORAGE_EMAIL 
  });

  if (isW3upInitialized && w3upClient) {
    console.log('✅ Using existing W3up client');
    return w3upClient;
  }

  if (!WEB3_STORAGE_EMAIL) {
    console.log('Web3.Storage email not configured, will use Pinata only');
    return null;
  }

  // If we've already tried and failed, don't keep trying (prevents repeated emails)
  if (w3upInitializationAttempted && !isW3upInitialized) {
    console.log('⚠️ Web3.Storage initialization already attempted and failed, using Pinata fallback');
    return null;
  }

  try {
    console.log('🚀 Creating new W3up client...');
    w3upInitializationAttempted = true; // Mark that we've attempted initialization
    
    const store = new StoreMemory();
    w3upClient = await create({ store });
    
    // Check if already logged in before attempting login
    const existingAccount = w3upClient.currentAccount();
    if (existingAccount) {
      console.log('✅ Already authenticated with Web3.Storage');
      isW3upInitialized = true;
      return w3upClient;
    }
    
    console.log('📧 Attempting Web3.Storage login with email:', WEB3_STORAGE_EMAIL);
    
    // Add timeout and better error handling
    const loginPromise = w3upClient.login(WEB3_STORAGE_EMAIL);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Login timeout after 10 seconds')), 10000)
    );
    
    await Promise.race([loginPromise, timeoutPromise]);
    
    // Check if we have a valid account/space
    const account = w3upClient.currentAccount();
    const space = w3upClient.currentSpace();
    
    console.log('🔐 Login status:', {
      hasAccount: !!account,
      hasSpace: !!space,
      accountDID: account?.did(),
      spaceDID: space?.did()
    });
    
    if (!account) {
      throw new Error('No account found - login may have failed or email not verified');
    }
    
    isW3upInitialized = true;
    console.log('✅ Web3.Storage initialized successfully');
    return w3upClient;
  } catch (error) {
    console.warn('⚠️ Web3.Storage initialization failed, will use Pinata fallback:', error.message);
    console.log('📋 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3)
    });
    // Don't throw error, just return null to use Pinata fallback
    return null;
  }
};

/**
 * Upload to Web3.Storage using w3up client
 */
const uploadToWeb3Storage = async (content, filename = null) => {
  try {
    const client = await initializeW3upClient();
    if (!client) {
      throw new Error('Web3.Storage client not available');
    }
    
    const file = new File(
      [content], 
      filename || `post_${Date.now()}.txt`, 
      { type: 'text/plain' }
    );

    const cid = await client.uploadFile(file);
    console.log('✅ Web3.Storage upload successful, CID:', cid.toString());
    return {
      success: true,
      cid: cid.toString(),
      method: 'Web3.Storage'
    };
  } catch (error) {
    console.warn('⚠️ Web3.Storage upload failed:', error.message);
    return {
      success: false,
      error: error.message,
      method: 'Web3.Storage'
    };
  }
};

/**
 * Upload to Pinata (supports both JWT and API Key methods)
 */
const uploadToPinata = async (content, filename = null) => {
  // Check if we have any Pinata credentials
  if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_SECRET_KEY)) {
    throw new Error('No Pinata credentials configured');
  }

  try {
    const formData = new FormData();
    const file = new File(
      [content], 
      filename || `post_${Date.now()}.txt`, 
      { type: 'text/plain' }
    );
    formData.append('file', file);

    // Add metadata
    const pinataMetadata = JSON.stringify({
      name: filename || `ZeroTrust_${Date.now()}`,
      keyvalues: {
        platform: 'ZeroTrustDApp',
        timestamp: Date.now().toString()
      }
    });
    formData.append('pinataMetadata', pinataMetadata);

    // Prepare headers based on available credentials
    const headers = {};
    if (PINATA_JWT) {
      headers['Authorization'] = `Bearer ${PINATA_JWT}`;
    } else if (PINATA_API_KEY && PINATA_SECRET_KEY) {
      headers['pinata_api_key'] = PINATA_API_KEY;
      headers['pinata_secret_api_key'] = PINATA_SECRET_KEY;
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Pinata error ${response.status}: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Pinata upload successful, CID:', result.IpfsHash);
    return {
      success: true,
      cid: result.IpfsHash,
      method: 'Pinata'
    };
  } catch (error) {
    console.warn('⚠️ Pinata upload failed:', error.message);
    return {
      success: false,
      error: error.message,
      method: 'Pinata'
    };
  }
};

/**
 * Main upload function - UPDATED: Tries Pinata first if we haven't successfully initialized Web3.Storage
 */
export const uploadTextToIPFS = async (content, filename = null) => {
  console.log('🚀 Starting IPFS upload...');
  
  // Strategy 1: Try Web3.Storage first ONLY if it's already initialized successfully
  if (WEB3_STORAGE_EMAIL && isW3upInitialized && w3upClient) {
    console.log('📡 Attempting Web3.Storage upload...');
    const w3Result = await uploadToWeb3Storage(content, filename);
    if (w3Result.success) {
      return w3Result.cid;
    }
  }

  // Strategy 2: Use Pinata (primary method now to avoid email spam)
  if (PINATA_JWT || (PINATA_API_KEY && PINATA_SECRET_KEY)) {
    console.log('📡 Attempting Pinata upload...');
    const pinataResult = await uploadToPinata(content, filename);
    if (pinataResult.success) {
      return pinataResult.cid;
    }
  }

  // Strategy 3: Try Web3.Storage as last resort (only if Pinata failed)
  if (WEB3_STORAGE_EMAIL && !isW3upInitialized) {
    console.log('📡 Attempting Web3.Storage upload as fallback...');
    const w3Result = await uploadToWeb3Storage(content, filename);
    if (w3Result.success) {
      return w3Result.cid;
    }
  }

  // If all fail, throw error with details
  throw new Error(
    'All IPFS upload methods failed. Please check your configuration:\n' +
    '1. Pinata: Set VITE_PINATA_JWT (recommended)\n' +
    '2. Web3.Storage: Set VITE_WEB3_STORAGE_EMAIL'
  );
};

/**
 * Upload JSON data to IPFS
 */
export const uploadJSONToIPFS = async (data, filename = null) => {
  const jsonString = JSON.stringify(data, null, 2);
  return await uploadTextToIPFS(jsonString, filename || `data_${Date.now()}.json`);
};

/**
 * Upload multiple files - UPDATED to prefer Pinata
 */
export const uploadFilesToIPFS = async (files) => {
  const fileArray = Array.from(files);
  if (fileArray.length === 0) {
    throw new Error('No files provided for upload');
  }

  // Try Pinata first for file uploads (more reliable)
  if (PINATA_JWT || (PINATA_API_KEY && PINATA_SECRET_KEY)) {
    try {
      // For single files, upload directly
      if (fileArray.length === 1) {
        const file = fileArray[0];
        const content = await file.text();
        const result = await uploadToPinata(content, file.name);
        return result.cid;
      } else {
        // For multiple files, create a simple directory structure
        console.log('⚠️ Multiple file upload to Pinata requires custom implementation');
        // For now, upload the first file
        const file = fileArray[0];
        const content = await file.text();
        const result = await uploadToPinata(content, file.name);
        return result.cid;
      }
    } catch (error) {
      console.warn('⚠️ Pinata file upload failed:', error.message);
    }
  }

  // Fallback to Web3.Storage
  if (WEB3_STORAGE_EMAIL && isW3upInitialized && w3upClient) {
    try {
      const client = w3upClient;
      const cid = fileArray.length === 1 
        ? await client.uploadFile(fileArray[0])
        : await client.uploadDirectory(fileArray);
      
      console.log('✅ Web3.Storage file upload successful, CID:', cid.toString());
      return cid.toString();
    } catch (error) {
      console.warn('⚠️ Web3.Storage file upload failed:', error.message);
    }
  }

  throw new Error('No file upload service available');
};

/**
 * Retrieve content from IPFS using multiple gateways
 */
export const retrieveFromIPFS = async (cid) => {
  const gateways = [
    'https://gateway.pinata.cloud/ipfs/', // Pinata gateway first (more reliable)
    'https://w3s.link/ipfs/',           // Web3.Storage gateway
    'https://ipfs.io/ipfs/',            // IPFS.io gateway
    'https://dweb.link/ipfs/',          // Dweb gateway
    'https://cloudflare-ipfs.com/ipfs/' // Cloudflare gateway
  ];

  for (const gateway of gateways) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${gateway}${cid}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ Retrieved content from ${gateway}`);
        return response;
      }
    } catch (error) {
      console.warn(`⚠️ Gateway ${gateway} failed:`, error.message);
      continue;
    }
  }

  throw new Error('Failed to retrieve content from all IPFS gateways');
};

/**
 * Get text content from IPFS
 */
export const getTextFromIPFS = async (cid, filename = null) => {
  try {
    const response = await retrieveFromIPFS(cid);
    const text = await response.text();
    return text;
  } catch (error) {
    console.error('Error getting text from IPFS:', error);
    throw error;
  }
};

/**
 * Get JSON data from IPFS
 */
export const getJSONFromIPFS = async (cid, filename = null) => {
  try {
    const text = await getTextFromIPFS(cid, filename);
    return JSON.parse(text);
  } catch (error) {
    console.error('Error getting JSON from IPFS:', error);
    throw error;
  }
};

/**
 * Create a structured post object
 */
export const createPostObject = (content, author, metadata = {}) => {
  return {
    content,
    author,
    timestamp: Date.now(),
    version: '1.0',
    metadata: {
      platform: 'ZeroTrustDApp',
      ...metadata
    }
  };
};

/**
 * Upload a complete post to IPFS
 */
export const uploadPostToIPFS = async (content, author, metadata = {}) => {
  try {
    const postObject = createPostObject(content, author, metadata);
    const cid = await uploadJSONToIPFS(postObject, `post_${author}_${Date.now()}.json`);
    return cid;
  } catch (error) {
    console.error('Error uploading post to IPFS:', error);
    throw error;
  }
};

/**
 * Check the status of all available IPFS services - UPDATED with less aggressive Web3.Storage checking
 */
export const getStorageStatus = async () => {
  console.log('🔍 Checking storage status...');
  
  const status = {
    web3Storage: { available: false, initialized: false },
    pinata: { available: false, configured: false },
    initialized: false,
    overall: 'checking...'
  };

  // Check Pinata first (primary service)
  status.pinata = {
    available: !!(PINATA_JWT || (PINATA_API_KEY && PINATA_SECRET_KEY)),
    configured: true,
    method: PINATA_JWT ? 'JWT' : (PINATA_API_KEY ? 'API Keys' : 'None'),
    hasJWT: !!PINATA_JWT,
    hasAPIKeys: !!(PINATA_API_KEY && PINATA_SECRET_KEY)
  };

  // Check Web3.Storage - but don't force initialization if it hasn't been attempted
  if (WEB3_STORAGE_EMAIL) {
    console.log('📧 Web3.Storage email configured:', WEB3_STORAGE_EMAIL);
    
    if (isW3upInitialized && w3upClient) {
      // Already successfully initialized
      const account = w3upClient.currentAccount();
      const space = w3upClient.currentSpace();
      
      status.web3Storage = {
        available: true,
        initialized: true,
        email: WEB3_STORAGE_EMAIL,
        hasAccount: !!account,
        hasSpace: !!space,
        accountDID: account?.did(),
        spaceDID: space?.did()
      };
    } else if (w3upInitializationAttempted) {
      // We tried but failed
      status.web3Storage = {
        available: false,
        initialized: false,
        email: WEB3_STORAGE_EMAIL,
        error: 'Initialization failed - using Pinata'
      };
    } else {
      // Haven't tried yet - don't initialize now to avoid email spam
      status.web3Storage = {
        available: false,
        initialized: false,
        email: WEB3_STORAGE_EMAIL,
        error: 'Not initialized - using Pinata primary'
      };
    }
  } else {
    status.web3Storage = {
      available: false,
      error: 'No email configured'
    };
  }

  // Set initialized to true if EITHER service is available
  status.initialized = status.web3Storage.available || status.pinata.available;
  
  if (status.initialized) {
    status.overall = 'ready';
  } else {
    status.overall = 'no services available';
  }

  console.log('📊 Final storage status:', status);
  return status;
};

/**
 * Test upload to verify everything works
 */
export const testUpload = async () => {
  try {
    const testContent = `Test upload ${Date.now()}`;
    const cid = await uploadTextToIPFS(testContent, 'test.txt');
    
    // Try to retrieve it
    const retrieved = await getTextFromIPFS(cid);
    
    return {
      success: true,
      cid,
      uploadedContent: testContent,
      retrievedContent: retrieved,
      match: testContent === retrieved
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Debug function - call this to troubleshoot issues
 */
export const debugIPFS = async () => {
  console.log('🐛 IPFS Debug Information:');
  console.log('='.repeat(50));
  
  // Environment variables
  console.log('📝 Configuration:');
  console.log('  Web3.Storage Email:', WEB3_STORAGE_EMAIL ? '✅ Set' : '❌ Missing');
  console.log('  Pinata JWT:', PINATA_JWT ? '✅ Set' : '❌ Missing');
  console.log('  Pinata API Keys:', (PINATA_API_KEY && PINATA_SECRET_KEY) ? '✅ Set' : '❌ Missing');
  
  // Client state
  console.log('\n🔧 Client State:');
  console.log('  W3up Client:', w3upClient ? '✅ Exists' : '❌ Null');
  console.log('  W3up Initialized:', isW3upInitialized ? '✅ Yes' : '❌ No');
  console.log('  W3up Attempted:', w3upInitializationAttempted ? '✅ Yes' : '❌ No');
  
  // Try to get status
  console.log('\n📊 Storage Status:');
  try {
    const status = await getStorageStatus();
    console.log('  Status Object:', status);
  } catch (error) {
    console.error('  Status Check Failed:', error.message);
  }
  
  // Try a simple upload test
  console.log('\n🧪 Upload Test:');
  try {
    const testResult = await testUpload();
    console.log('  Test Result:', testResult);
  } catch (error) {
    console.error('  Upload Test Failed:', error.message);
  }
  
  console.log('='.repeat(50));
  console.log('Debug complete. Check the logs above for issues.');
};

/**
 * Utility functions
 */
export const getIPFSGatewayURL = (cid, filename = '') => {
  const baseUrl = 'https://gateway.pinata.cloud/ipfs/';
  return filename ? `${baseUrl}${cid}/${filename}` : `${baseUrl}${cid}`;
};

export const getAlternativeGatewayURLs = (cid, filename = '') => {
  const gateways = [
    'https://gateway.pinata.cloud/ipfs/', // Pinata first
    'https://w3s.link/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://dweb.link/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/'
  ];
  
  const path = filename ? `${cid}/${filename}` : cid;
  return gateways.map(gateway => `${gateway}${path}`);
};

/**
 * Configuration helper
 */
export const getConfigurationHelp = () => {
  return {
    required: 'At least one IPFS service must be configured',
    recommended: 'Use Pinata JWT for best experience (no email verification required)',
    pinata: {
      env: 'VITE_PINATA_JWT',
      description: 'Pinata JWT token (recommended - no email spam)',
      getFrom: 'https://app.pinata.cloud/keys'
    },
    web3Storage: {
      env: 'VITE_WEB3_STORAGE_EMAIL',
      description: 'Your email for Web3.Storage authentication',
      note: 'May require email verification and can cause email spam'
    }
  };
};