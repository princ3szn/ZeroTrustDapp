import React, { useState } from 'react';
import { Container, Row, Col, Button, Modal } from 'react-bootstrap';

const HeroSection = ({ currentAccount, userInfo, connectWallet, isConnecting }) => {
  const [showLearnMore, setShowLearnMore] = useState(false);

  const handleGetStarted = () => {
    if (!currentAccount && connectWallet) {
      connectWallet();
    }
  };

  const handleLearnMore = () => {
    setShowLearnMore(true);
  };

  return (
    <>
      <div 
        className="hero-section text-white py-5" 
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle background grid/pattern */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 75% 50%, rgba(255,255,255,0.05) 0%, transparent 50%)',
            backgroundSize: '20px 20px',
            opacity: 0.5,
            zIndex: 1
          }}
        />

        <Container className="position-relative" style={{ zIndex: 2 }}>
          <Row className="align-items-center">
            <Col md={7}>
              <h1 
                className="display-3 fw-bold mb-4" 
                style={{ 
                  background: 'linear-gradient(to right, #00b4db, #0083b0)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                ZeroTrust Dapp
              </h1>
              <p className="lead mb-4 text-muted">
                Decentralized platform ensuring absolute privacy, 
                transparent interactions, and robust user verification 
                through blockchain technology.
              </p>

              {currentAccount && userInfo && (
                <div className="mb-4">
                  {userInfo.isBanned && (
                    <div className="alert alert-danger">
                      Account Suspended: {new Date(userInfo.banExpiry * 1000).toLocaleString()}
                    </div>
                  )}
                  {!userInfo.isVerified && (
                    <div className="alert alert-warning">
                      Account Not Verified
                    </div>
                  )}
                </div>
              )}

              <div className="d-flex align-items-center">
                <Button 
                  variant="outline-light" 
                  className="me-3 px-4 py-2"
                  style={{
                    borderWidth: '2px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                  onClick={handleGetStarted}
                  disabled={isConnecting}
                >
                  {currentAccount ? 'Connected' : (isConnecting ? 'Connecting...' : 'Get Started')}
                </Button>
                <Button 
                  variant="outline-info" 
                  className="px-4 py-2"
                  style={{
                    borderWidth: '2px',
                    borderRadius: '10px',
                    background: 'rgba(0,180,219,0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                  onClick={handleLearnMore}
                >
                  Learn More
                </Button>
              </div>
            </Col>
            <Col md={5}>
              <div 
                className="rounded-4 shadow-lg" 
                style={{
                  background: 'linear-gradient(145deg, #1e2a3a, #161d28)',
                  padding: '2rem',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <div 
                  className="bg-dark rounded-4" 
                  style={{
                    height: '300px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6c757d'
                  }}
                >
                  {/* Placeholder for blockchain/Web3 graphic */}
                  Blockchain Visualization
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Learn More Modal */}
      <Modal show={showLearnMore} onHide={() => setShowLearnMore(false)} size="lg" centered>
        <Modal.Header 
          closeButton 
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: 'none'
          }}
        >
          <Modal.Title className="text-white">
            <span style={{
              background: 'linear-gradient(to right, #00b4db, #0083b0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              About ZeroTrust Dapp
            </span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body 
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            color: 'white'
          }}
        >
          <div className="mb-4">
            <h5 className="text-info mb-3">🔒 What is ZeroTrust?</h5>
            <p className="text-muted">
              ZeroTrust is a revolutionary decentralized application built on blockchain technology 
              that prioritizes user privacy, security, and transparent interactions. Our platform 
              operates on the principle of "never trust, always verify."
            </p>
          </div>

          <div className="mb-4">
            <h5 className="text-info mb-3">🚀 Key Features</h5>
            <Row>
              <Col md={6}>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <strong className="text-success">✅ Decentralized Storage:</strong>
                    <br />
                    <small className="text-muted">Your content is stored on IPFS, ensuring censorship resistance and data ownership.</small>
                  </li>
                  <li className="mb-2">
                    <strong className="text-success">✅ User Verification:</strong>
                    <br />
                    <small className="text-muted">Multi-layered verification system to build trust and credibility.</small>
                  </li>
                  <li className="mb-2">
                    <strong className="text-success">✅ Privacy First:</strong>
                    <br />
                    <small className="text-muted">Your data remains private and under your control at all times.</small>
                  </li>
                </ul>
              </Col>
              <Col md={6}>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <strong className="text-success">✅ Transparent Governance:</strong>
                    <br />
                    <small className="text-muted">Community-driven decisions with on-chain governance.</small>
                  </li>
                  <li className="mb-2">
                    <strong className="text-success">✅ Web3 Integration:</strong>
                    <br />
                    <small className="text-muted">Seamless integration with Web3 wallets and blockchain infrastructure.</small>
                  </li>
                  <li className="mb-2">
                    <strong className="text-success">✅ Cross-Platform:</strong>
                    <br />
                    <small className="text-muted">Access your content from anywhere, anytime.</small>
                  </li>
                </ul>
              </Col>
            </Row>
          </div>

          <div className="mb-4">
            <h5 className="text-info mb-3">🛡️ How It Works</h5>
            <div className="bg-dark p-3 rounded">
              <ol className="text-muted mb-0">
                <li><strong>Connect Wallet:</strong> Link your MetaMask or compatible Web3 wallet</li>
                <li><strong>Register & Verify:</strong> Complete the registration and verification process</li>
                <li><strong>Create Content:</strong> Post content that gets stored on IPFS</li>
                <li><strong>Interact Safely:</strong> Engage with verified users in a trusted environment</li>
              </ol>
            </div>
          </div>

          <div className="mb-4">
            <h5 className="text-info mb-3">🌐 Technology Stack</h5>
            <Row>
              <Col md={6}>
                <div className="badge bg-primary me-2 mb-2">Ethereum Blockchain</div>
                <div className="badge bg-primary me-2 mb-2">IPFS Storage</div>
                <div className="badge bg-primary me-2 mb-2">Smart Contracts</div>
              </Col>
              <Col md={6}>
                <div className="badge bg-info me-2 mb-2">Web3.Storage</div>
                <div className="badge bg-info me-2 mb-2">Pinata</div>
                <div className="badge bg-info me-2 mb-2">MetaMask</div>
              </Col>
            </Row>
          </div>

          <div className="alert alert-info" style={{ background: 'rgba(0,180,219,0.1)', border: '1px solid rgba(0,180,219,0.3)' }}>
            <strong>🎯 Getting Started:</strong> Connect your wallet to begin your journey into the decentralized web. 
            Experience true digital ownership and privacy like never before.
          </div>
        </Modal.Body>
        <Modal.Footer 
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: 'none'
          }}
        >
          <Button variant="secondary" onClick={() => setShowLearnMore(false)}>
            Close
          </Button>
          {!currentAccount && (
            <Button 
              variant="primary" 
              onClick={() => {
                setShowLearnMore(false);
                handleGetStarted();
              }}
              disabled={isConnecting}
              style={{
                background: 'linear-gradient(to right, #00b4db, #0083b0)',
                border: 'none'
              }}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet & Get Started'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default HeroSection;