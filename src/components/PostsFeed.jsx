// components/PostsFeed.js
import React, { useState, useEffect } from 'react';
import { Card, Alert, Spinner, Button, Form, InputGroup } from 'react-bootstrap';
import { getEthereumContract } from '../utils/contract';
import PostDisplay from './PostDisplay';

const PostsFeed = ({ currentAccount, userInfo }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'mine', 'verified'
  const [searchCID, setSearchCID] = useState('');

  useEffect(() => {
    if (currentAccount) {
      loadPosts();
    }
  }, [currentAccount, filter]);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const contract = await getEthereumContract();
      
      // Get ContentPosted events
      const contentPostedFilter = contract.filters.ContentPosted();
      const events = await contract.queryFilter(contentPostedFilter, -1000); // Last 1000 blocks
      
      // Process events to extract post data
      const postsData = events.map(event => ({
        author: event.args.user,
        ipfsHash: event.args.ipfsHash,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: null // Will be filled by block timestamp
      }));

      // Get block timestamps for posts
      const postsWithTimestamps = await Promise.all(
        postsData.map(async (post) => {
          try {
            const block = await contract.provider.getBlock(post.blockNumber);
            return {
              ...post,
              timestamp: block.timestamp * 1000 // Convert to milliseconds
            };
          } catch (error) {
            console.error('Error getting block timestamp:', error);
            return {
              ...post,
              timestamp: Date.now() // Fallback to current time
            };
          }
        })
      );

      // Apply filters
      let filteredPosts = postsWithTimestamps;
      
      if (filter === 'mine' && currentAccount) {
        filteredPosts = filteredPosts.filter(post => 
          post.author.toLowerCase() === currentAccount.toLowerCase()
        );
      } else if (filter === 'verified') {
        // Note: You might want to check verification status for each author
        // This is a simplified version
        filteredPosts = filteredPosts; // Keep all for now
      }

      // Sort by timestamp (newest first)
      filteredPosts.sort((a, b) => b.timestamp - a.timestamp);

      setPosts(filteredPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      setError(`Failed to load posts: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadPosts();
  };

  const handleSearchByCID = () => {
    if (!searchCID.trim()) {
      setError('Please enter a valid IPFS CID');
      return;
    }

    // Add the searched CID as a temporary post
    const searchPost = {
      author: 'Unknown',
      ipfsHash: searchCID.trim(),
      blockNumber: 0,
      transactionHash: 'manual-search',
      timestamp: Date.now(),
      isSearchResult: true
    };

    setPosts(prevPosts => [searchPost, ...prevPosts]);
    setSearchCID('');
  };

  const handlePostError = (error, cid) => {
    console.error(`Error loading post ${cid}:`, error);
    // Optionally remove problematic posts or mark them as failed
  };

  const getFilterCount = () => {
    switch (filter) {
      case 'mine':
        return posts.filter(post => 
          post.author.toLowerCase() === currentAccount?.toLowerCase()
        ).length;
      case 'verified':
        return posts.length; // Simplified
      default:
        return posts.length;
    }
  };

  return (
    <div>
      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Posts Feed</h5>
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" />
                  Loading...
                </>
              ) : (
                'Refresh'
              )}
            </Button>
          </div>
        </Card.Header>
        
        <Card.Body>
          {/* Filter Controls */}
          <div className="row mb-3">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Filter Posts</Form.Label>
                <Form.Select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value)}
                  disabled={loading}
                >
                  <option value="all">All Posts ({posts.length})</option>
                  <option value="mine">My Posts</option>
                  <option value="verified">Verified Users</option>
                </Form.Select>
              </Form.Group>
            </div>
            
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Search by IPFS CID</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Enter IPFS CID..."
                    value={searchCID}
                    onChange={(e) => setSearchCID(e.target.value)}
                    disabled={loading}
                  />
                  <Button 
                    variant="outline-secondary"
                    onClick={handleSearchByCID}
                    disabled={!searchCID.trim() || loading}
                  >
                    Search
                  </Button>
                </InputGroup>
              </Form.Group>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert 
              variant="danger" 
              onClose={() => setError(null)} 
              dismissible
              className="mb-3"
            >
              {error}
            </Alert>
          )}

          {/* Loading State */}
          {loading && posts.length === 0 && (
            <div className="text-center p-4">
              <Spinner animation="border" className="mb-2" />
              <div>Loading posts from blockchain...</div>
            </div>
          )}

          {/* No Posts State */}
          {!loading && posts.length === 0 && (
            <Alert variant="info" className="text-center">
              <h6>No posts found</h6>
              <p className="mb-0">
                {filter === 'mine' 
                  ? "You haven't posted anything yet." 
                  : "No posts available. Be the first to post!"
                }
              </p>
            </Alert>
          )}

          {/* Posts Statistics */}
          {posts.length > 0 && (
            <div className="mb-3 p-2 bg-light rounded">
              <small className="text-muted">
                Showing {getFilterCount()} posts
                {filter === 'mine' && ' by you'}
                {filter === 'verified' && ' by verified users'}
              </small>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Posts List */}
      <div>
        {posts.map((post, index) => (
          <div key={`${post.transactionHash}-${index}`}>
            {post.isSearchResult && (
              <Alert variant="info" className="mb-2">
                <strong>Search Result:</strong> Displaying content for CID: {post.ipfsHash}
              </Alert>
            )}
            
            <PostDisplay
              cid={post.ipfsHash}
              author={post.author}
              timestamp={post.timestamp}
              onError={(error) => handlePostError(error, post.ipfsHash)}
            />
          </div>
        ))}
      </div>

      {/* Load More Button (for pagination if needed) */}
      {posts.length > 0 && !loading && (
        <div className="text-center">
          <Button 
            variant="outline-primary"
            onClick={() => {
              // Implement load more functionality if needed
              console.log('Load more posts...');
            }}
          >
            Load Older Posts
          </Button>
        </div>
      )}
    </div>
  );
};

export default PostsFeed;