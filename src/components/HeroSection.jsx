import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';

const HeroSection = ({ currentAccount, userInfo }) => {
  return (
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
              >
                Get Started
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
  );
};

export default HeroSection;