// components/PostDisplay.js
import React, { useState, useEffect } from 'react';
import { Card, Alert, Spinner, Button, Badge, Modal } from 'react-bootstrap';
import { getJSONFromIPFS, getTextFromIPFS, getIPFSGatewayURL, getAlternativeGatewayURLs } from '../utils/ipfs';

const PostDisplay = ({ cid, author, timestamp, onError }) => {
  const [postData, setPostData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFiles, setShowFiles] = useState(false);
  const [gatewayIndex, setGatewayIndex] = useState(0);

  useEffect(() => {
    loadPostContent();
  }, [cid]);

  const loadPostContent = async () => {
    if (!cid) return;

    setLoading(true);
    setError(null);

    try {
      // Try to load as JSON first (structured post)
      const data = await getJSONFromIPFS(cid);
      setPostData(data);
    } catch (jsonError) {
      try {
        // Fallback: try to load as plain text
        const textContent = await getTextFromIPFS(cid);
        setPostData({
          content: textContent,
          author: author || 'Unknown',
          timestamp: timestamp || Date.now(),
          isPlainText: true
        });
      } catch (textError) {
        console.error('Error loading post content:', textError);
        setError(`Failed to load content: ${textError.message}`);
        if (onError) onError(textError);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleRetry = () => {
    loadPostContent();
  };

  const getFileURL = (filename) => {
    const gateways = getAlternativeGatewayURLs(postData.metadata?.filesCID || cid, filename);
    return gateways[gatewayIndex % gateways.length];
  };

  const tryNextGateway = () => {
    setGatewayIndex(prev => prev + 1);
  };

  if (loading) {
    return (
      <Card className="mb-3">
        <Card.Body className="text-center">
          <Spinner animation="border" size="sm" className="me-2" />
          Loading post from IPFS...
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-3 border-danger">
        <Card.Body>
          <Alert variant="danger" className="mb-2">
            <strong>Failed to load post:</strong> {error}
          </Alert>
          <div className="d-flex gap-2">
            <Button variant="outline-primary" size="sm" onClick={handleRetry}>
              Retry
            </Button>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={tryNextGateway}
            >
              Try Different Gateway
            </Button>
          </div>
          <div className="mt-2">
            <small className="text-muted">
              IPFS CID: <code>{cid}</code>
            </small>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (!postData) {
    return (
      <Card className="mb-3">
        <Card.Body>
          <Alert variant="warning">
            No content found for CID: <code>{cid}</code>
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <strong>
              {postData.author?.slice(0, 6)}...{postData.author?.slice(-4)}
            </strong>
            {!postData.isPlainText && (
              <Badge bg="success" className="ms-2">
                Structured Post
              </Badge>
            )}
            {postData.metadata?.hasFiles && (
              <Badge bg="info" className="ms-2">
                {postData.metadata.filesCount} Files
              </Badge>
            )}
          </div>
          <small className="text-muted">
            {formatTimestamp(postData.timestamp)}
          </small>
        </Card.Header>
        
        <Card.Body>
          {/* Post Content */}
          <div className="mb-3">
            {postData.content ? (
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {postData.content}
              </div>
            ) : (
              <em className="text-muted">No text content</em>
            )}
          </div>

          {/* Files Section */}
          {postData.metadata?.hasFiles && (
            <div className="border-top pt-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">Attached Files</h6>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => setShowFiles(true)}
                >
                  View Files ({postData.metadata.filesCount})
                </Button>
              </div>
              
              {postData.metadata.fileNames && (
                <div>
                  <small className="text-muted">
                    Files: {postData.metadata.fileNames.join(', ')}
                  </small>
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          {postData.metadata && !postData.isPlainText && (
            <div className="border-top pt-2 mt-3">
              <small className="text-muted">
                Platform: {postData.metadata.platform || 'Unknown'} | 
                Version: {postData.version || '1.0'}
              </small>
            </div>
          )}

          {/* IPFS Info */}
          <div className="border-top pt-2 mt-2">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                IPFS: <code>{cid}</code>
              </small>
              <div>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0"
                  href={getIPFSGatewayURL(cid)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on IPFS
                </Button>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Files Modal */}
      {postData.metadata?.hasFiles && (
        <Modal 
          show={showFiles} 
          onHide={() => setShowFiles(false)}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Attached Files</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {postData.metadata.fileNames ? (
              <div>
                {postData.metadata.fileNames.map((filename, index) => (
                  <Card key={index} className="mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{filename}</h6>
                          <small className="text-muted">
                            Stored in IPFS: {postData.metadata.filesCID}
                          </small>
                        </div>
                        <div>
                          <Button
                            variant="primary"
                            size="sm"
                            href={getFileURL(filename)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Download
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert variant="info">
                Files are available but metadata is incomplete. 
                <Button
                  variant="link"
                  href={getIPFSGatewayURL(postData.metadata.filesCID)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Files Directly
                </Button>
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowFiles(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
};

export default PostDisplay;