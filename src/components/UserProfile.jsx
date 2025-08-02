import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { useTheme } from '../context/ThemeContext';  // Adjust path as needed

const UserProfile = ({ 
  currentAccount, 
  userInfo, 
  handleVerify,
  handleRegister 
}) => {
  const { darkMode } = useTheme();

  const formatAddress = (address) => {
    return address 
      ? `${address.substring(0, 10)}...${address.substring(address.length - 4)}`
      : 'Connect Wallet';
  };

  const renderUserStatus = () => {
    if (!userInfo) return null;

    if (userInfo.isBanned) {
      return (
        <Badge bg="danger" className="mb-2">
          Banned until: {new Date(userInfo.banExpiry * 1000).toLocaleString()}
        </Badge>
      );
    }

    return (
      <Badge bg={userInfo.isVerified ? 'success' : 'warning'} className="mb-2">
        {userInfo.isVerified ? 'Verified' : 'Not Verified'}
      </Badge>
    );
  };

  return (
    <Card 
      className="mb-4"
      style={{ 
        backgroundColor: darkMode ? '#2c2c2c' : '#ffffff',
        color: darkMode ? '#e0e0e0' : '#000000'
      }}
    >
      <Card.Body>
        <Card.Title>
          Profile: {formatAddress(currentAccount)}
        </Card.Title>
        
        {currentAccount && (
          <>
            {userInfo ? (
              <>
                {renderUserStatus()}
                
                <div className="mb-3">
                  <strong>Offenses:</strong> {userInfo.offenses}
                </div>

                {!userInfo.isVerified && (
                  <Button 
                    variant={darkMode ? "warning" : "primary"}
                    onClick={handleVerify}
                    className="me-2"
                  >
                    Verify Account
                  </Button>
                )}
              </>
            ) : (
              <Button 
                variant={darkMode ? "outline-light" : "primary"}
                onClick={handleRegister}
                className="me-2"
              >
                Register Account
              </Button>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default UserProfile;