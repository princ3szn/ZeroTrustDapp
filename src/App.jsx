import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
//import spamFilter from './utils/spamFilter.json';
import { ethers } from "ethers";

// Import ThemeProvider
import { ThemeProvider } from './context/ThemeContext';

// Import IPFS utilities
import { 
  uploadPostToIPFS, 
  getJSONFromIPFS, 
  getStorageStatus,
  getIPFSGatewayURL,
  uploadFilesToIPFS
} from './utils/ipfs';

import { 
  connectWallet as connectWalletUtil,
  checkNetworkAndConnect, 
  getUserDetails, 
  registerNewUser, 
  verifyUser,
  postContent as postContentUtil,
  getCurrentAccount,
  isMetaMaskInstalled,
  onAccountsChanged,
  onChainChanged,
  removeAllListeners
} from "./utils/contract";

import AppNavbar from './components/AppNavbar';
import HeroSection from './components/Herosection';
import UserProfile from './components/UserProfile';
import PostsFeed from './components/PostsFeed';

function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [postContent, setPostContent] = useState('');
  const [posts, setPosts] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // IPFS-related states
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [ipfsStatus, setIpfsStatus] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // UPDATED: Check IPFS status on component mount
  useEffect(() => {
    const checkIPFSStatus = async () => {
      try {
        const status = await getStorageStatus();
        console.log('🔍 Full IPFS Status:', status); // Debug log
        setIpfsStatus(status);
        
        // Updated logic to check if any service is available
        const isConfigured = status.web3Storage?.available || status.pinata?.available;
        
        if (!isConfigured) {
          setError('IPFS Storage not configured. Please add either Web3.Storage email or Pinata JWT to your .env file');
        }
      } catch (error) {
        console.error('Error checking IPFS status:', error);
        setIpfsStatus({ 
          initialized: false, 
          web3Storage: { available: false },
          pinata: { available: false },
          error: error.message 
        });
      }
    };

    checkIPFSStatus();
  }, []);

  // Check if already connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled()) {
        return;
      }

      try {
        const account = await getCurrentAccount();
        if (account) {
          setCurrentAccount(account);
          const details = await getUserDetails(account);
          setUserInfo(details);
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    };

    checkConnection();
  }, []);

  // Wallet Connection
  const connectWallet = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // Check if MetaMask is installed
      if (!isMetaMaskInstalled()) {
        throw new Error("MetaMask is not installed. Please install MetaMask!");
      }

      // Connect wallet
      const account = await connectWalletUtil();
      console.log("Connected account:", account);
      
      // Check and switch network if needed
      await checkNetworkAndConnect();
      
      // Set current account
      setCurrentAccount(account);
      
      // Fetch user details
      try {
        const details = await getUserDetails(account);
        setUserInfo(details);
      } catch (detailsError) {
        console.log("User not registered yet:", detailsError.message);
        // User might not be registered yet, that's okay
        setUserInfo(null);
      }
      
    } catch (error) {
      console.error("Connection error:", error);
      setError(error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Wallet
  const disconnectWallet = () => {
    setCurrentAccount(null);
    setUserInfo(null);
    setError(null);
    
    // Remove event listeners
    removeAllListeners();
  };

  // User Registration
  const handleRegister = async () => {
    if (!currentAccount) {
      setError("Please connect wallet first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const receipt = await registerNewUser();
      console.log("Registration successful:", receipt);
      
      // Refresh user info after successful registration
      const details = await getUserDetails(currentAccount);
      setUserInfo(details);
      
    } catch (error) {
      console.error("Registration error:", error);
      setError(`Registration failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // User Verification
  const handleVerify = async () => {
    if (!currentAccount) {
      setError("Please connect wallet first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const receipt = await verifyUser();
      console.log("Verification successful:", receipt);
      
      // Refresh user info after successful verification
      const details = await getUserDetails(currentAccount);
      setUserInfo(details);
      
    } catch (error) {
      console.error("Verification error:", error);
      setError(`Verification failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const files = event.target.files;
    setSelectedFiles(files);
  };

  // Preview post content
  const handlePreview = () => {
    if (!postContent.trim() && !selectedFiles) {
      setError("Please add content or select files to preview");
      return;
    }
    setShowPreview(true);
  };

  // UPDATED: Post Content with IPFS Integration
  const handlePostContent = async () => {
    if (!currentAccount) {
      setError("Please connect wallet first");
      return;
    }

    if (!postContent.trim() && !selectedFiles) {
      setError("Please add content or select files to post");
      return;
    }

    if (!userInfo || !userInfo.isVerified) {
      setError("You must be verified to post content");
      return;
    }

    // UPDATED: Check if any IPFS service is available
    const isIPFSAvailable = ipfsStatus?.web3Storage?.available || ipfsStatus?.pinata?.available;
    if (!isIPFSAvailable) {
      setError("IPFS storage not available. Please configure Web3.Storage or Pinata.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setUploadProgress('Preparing content...');

    try {
      let ipfsHash;

      if (selectedFiles && selectedFiles.length > 0) {
        // Upload files to IPFS
        setUploadProgress('Uploading files to IPFS...');
        ipfsHash = await uploadFilesToIPFS(selectedFiles);
        
        // If there's also text content, create a combined post
        if (postContent.trim()) {
          const postMetadata = {
            hasFiles: true,
            filesCID: ipfsHash,
            filesCount: selectedFiles.length,
            fileNames: Array.from(selectedFiles).map(file => file.name)
          };
          
          setUploadProgress('Uploading post metadata to IPFS...');
          ipfsHash = await uploadPostToIPFS(postContent, currentAccount, postMetadata);
        }
      } else {
        // Upload text content only
        setUploadProgress('Uploading post to IPFS...');
        ipfsHash = await uploadPostToIPFS(postContent, currentAccount);
      }

      console.log("Content uploaded to IPFS with hash:", ipfsHash);
      
      // Post to blockchain
      setUploadProgress('Posting to blockchain...');
      const receipt = await postContentUtil(ipfsHash);
      console.log("Content posted to blockchain successfully:", receipt);
      
      // Clear post content and files
      setPostContent('');
      setSelectedFiles(null);
      // Reset file input
      const fileInput = document.getElementById('fileInput');
      if (fileInput) fileInput.value = '';
      
      setUploadProgress('');
      
      // Show success message
      alert(`Post successful! IPFS Hash: ${ipfsHash}`);
      
    } catch (error) {
      console.error("Post content error:", error);
      setError(`Failed to post content: ${error.message}`);
      setUploadProgress('');
    } finally {
      setIsLoading(false);
    }
  };

  // Load post from IPFS (example function)
  const loadPostFromIPFS = async (cid) => {
    try {
      const postData = await getJSONFromIPFS(cid);
      console.log("Loaded post from IPFS:", postData);
      return postData;
    } catch (error) {
      console.error("Error loading post from IPFS:", error);
      throw error;
    }
  };

  // Set up event listeners for account and network changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) {
      return;
    }

    const handleAccountsChanged = async (accounts) => {
      console.log("Accounts changed:", accounts);
      
      if (accounts.length > 0) {
        const newAccount = accounts[0];
        setCurrentAccount(newAccount);
        
        try {
          const details = await getUserDetails(newAccount);
          setUserInfo(details);
        } catch (error) {
          console.log("New account not registered:", error.message);
          setUserInfo(null);
        }
      } else {
        // User disconnected all accounts
        disconnectWallet();
      }
    };

    const handleChainChanged = (chainId) => {
      console.log("Chain changed:", chainId);
      // Refresh the page when network changes
      window.location.reload();
    };

    // Add event listeners
    onAccountsChanged(handleAccountsChanged);
    onChainChanged(handleChainChanged);

    // Cleanup function
    return () => {
      removeAllListeners();
    };
  }, []);

  return (
    <ThemeProvider>
      <div>
        <AppNavbar 
          currentAccount={currentAccount} 
          connectWallet={connectWallet}
          disconnectWallet={disconnectWallet}
          userInfo={userInfo}
          isConnecting={isConnecting}
        />

        <Container className="mt-4">
          {error && (
            <Alert 
              variant="danger" 
              onClose={() => setError(null)} 
              dismissible
              className="mb-4"
            >
              <strong>Error:</strong> {error}
            </Alert>
          )}

          {!isMetaMaskInstalled() && (
            <Alert variant="warning" className="mb-4">
              <strong>MetaMask Required:</strong> Please install MetaMask to use this application.{' '}
              <a 
                href="https://metamask.io/download/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="alert-link"
              >
                Download MetaMask
              </a>
            </Alert>
          )}

          {/* UPDATED: IPFS Status Alert */}
          {ipfsStatus && !ipfsStatus.initialized && (
            <Alert variant="warning" className="mb-4">
              <strong>IPFS Storage Not Configured:</strong> Please add your Web3.Storage API token or Pinata JWT to enable decentralized storage.{' '}
              <a 
                href="https://web3.storage" 
                target="_blank" 
                rel="noopener noreferrer"
                className="alert-link"
              >
                Get Web3.Storage Token
              </a>
              {' or '}
              <a 
                href="https://app.pinata.cloud/keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="alert-link"
              >
                Get Pinata JWT
              </a>
            </Alert>
          )}

          <HeroSection 
            currentAccount={currentAccount}
            userInfo={userInfo}
          />

          <Row>
            <Col md={4}>
              <UserProfile 
                currentAccount={currentAccount}
                userInfo={userInfo}
                handleVerify={handleVerify}
                handleRegister={handleRegister}
                isLoading={isLoading}
              />
              
              {/* UPDATED: IPFS Status Card */}
              {ipfsStatus && (
                <div className="card mt-3">
                  <div className="card-header">
                    <h6>IPFS Storage Status</h6>
                  </div>
                  <div className="card-body">
                    <div className={`badge ${ipfsStatus.initialized ? 'bg-success' : 'bg-danger'}`}>
                      {ipfsStatus.initialized ? 'Connected' : 'Not Configured'}
                    </div>
                    
                    {/* Show which services are available */}
                    {ipfsStatus.initialized && (
                      <div className="mt-2">
                        {ipfsStatus.web3Storage?.available && (
                          <small className="text-success d-block">✅ Web3.Storage: Available</small>
                        )}
                        {ipfsStatus.pinata?.available && (
                          <small className="text-success d-block">✅ Pinata: Available</small>
                        )}
                      </div>
                    )}
                    
                    {ipfsStatus.error && (
                      <p className="text-muted small mt-2">{ipfsStatus.error}</p>
                    )}
                  </div>
                </div>
              )}
            </Col>

            <Col md={8}>
              {currentAccount && userInfo && (
                <div className="card">
                  <div className="card-header">
                    <h5>Create Post</h5>
                  </div>
                  <div className="card-body">
                    {userInfo.isVerified ? (
                      <>
                        <Form.Group className="mb-3">
                          <Form.Label>Post Content</Form.Label>
                          <Form.Control 
                            as="textarea"
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            placeholder="Write your post..."
                            rows={4}
                            disabled={isLoading}
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Attach Files (optional)</Form.Label>
                          <Form.Control
                            type="file"
                            id="fileInput"
                            multiple
                            onChange={handleFileSelect}
                            disabled={isLoading}
                          />
                          {selectedFiles && (
                            <div className="mt-2">
                              <small className="text-muted">
                                Selected: {Array.from(selectedFiles).map(f => f.name).join(', ')}
                              </small>
                            </div>
                          )}
                        </Form.Group>

                        {uploadProgress && (
                          <div className="mb-3">
                            <div className="d-flex align-items-center">
                              <Spinner animation="border" size="sm" className="me-2" />
                              <small>{uploadProgress}</small>
                            </div>
                          </div>
                        )}

                        <div className="d-flex gap-2">
                          <Button 
                            onClick={handlePreview}
                            disabled={(!postContent.trim() && !selectedFiles) || isLoading}
                            variant="outline-primary"
                          >
                            Preview
                          </Button>
                          {/* UPDATED: Button disabled condition */}
                          <Button 
                            onClick={handlePostContent}
                            disabled={
                              (!postContent.trim() && !selectedFiles) || 
                              isLoading || 
                              !(ipfsStatus?.web3Storage?.available || ipfsStatus?.pinata?.available)
                            }
                            variant="primary"
                          >
                            {isLoading ? 'Posting...' : 'Post to IPFS & Blockchain'}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Alert variant="info">
                        You must be verified to post content. Please complete the verification process.
                      </Alert>
                    )}
                  </div>
                </div>
              )}

              {currentAccount && !userInfo && (
                <Alert variant="warning">
                  Please register first to access all features.
                </Alert>
              )}
            </Col>
          </Row>

          {/* Posts Feed Section */}
          {currentAccount && (
            <Row className="mt-4">
              <Col>
                <PostsFeed 
                  currentAccount={currentAccount}
                  userInfo={userInfo}
                />
              </Col>
            </Row>
          )}
        </Container>

        {/* UPDATED: Preview Modal */}
        <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Post Preview</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {postContent && (
              <div className="mb-3">
                <h6>Content:</h6>
                <div className="border p-3 rounded bg-light">
                  {postContent}
                </div>
              </div>
            )}
            {selectedFiles && (
              <div>
                <h6>Files to upload:</h6>
                <ul className="list-unstyled">
                  {Array.from(selectedFiles).map((file, index) => (
                    <li key={index} className="border p-2 rounded mb-2">
                      <strong>{file.name}</strong><br />
                      <small className="text-muted">
                        Size: {(file.size / 1024).toFixed(2)} KB | Type: {file.type}
                      </small>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            {/* UPDATED: Modal button disabled condition */}
            <Button 
              variant="primary" 
              onClick={() => {
                setShowPreview(false);
                handlePostContent();
              }}
              disabled={!(ipfsStatus?.web3Storage?.available || ipfsStatus?.pinata?.available)}
            >
              Confirm & Post
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </ThemeProvider>
  );
}

export default App;