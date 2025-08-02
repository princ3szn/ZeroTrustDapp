import React from 'react';
import { Navbar, Container, Button, Nav, Badge } from 'react-bootstrap';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';  // Adjust path as needed

const AppNavbar = ({
  currentAccount,
  connectWallet,
  disconnectWallet,
  userInfo,
  isConnecting
}) => {
  const { darkMode, toggleDarkMode } = useTheme();

  const formatAddress = (address) => {
    return address
      ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
      : 'Connect Wallet';
  };

  const renderUserStatus = () => {
    if (!userInfo) return null;

    if (userInfo.isBanned) {
      return (
        <Badge bg="danger" className="me-2">
          Banned
        </Badge>
      );
    }

    return (
      <Badge bg={userInfo.isVerified ? 'success' : 'warning'} className="me-2">
        {userInfo.isVerified ? 'Verified' : 'Not Verified'}
      </Badge>
    );
  };

  return (
    <Navbar
      expand="lg"
      className={`${darkMode ? 'bg-dark navbar-dark' : 'bg-light navbar-light'} mb-0`}
      style={{
        background: darkMode
          ? 'linear-gradient(to right, #1a1a2e, #16213e)'
          : 'linear-gradient(to right, #f4f4f4, #e0e0e0)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <Container>
        <Navbar.Brand href="#home" className="fw-bold">
          ZeroTrust Dapp
        </Navbar.Brand>

        <Navbar.Toggle />
        <Navbar.Collapse className="justify-content-end align-items-center">
          {/* Dark Mode Toggle with Icons */}
          <Button
            variant="link"
            className="me-3 p-0"
            onClick={toggleDarkMode}
            style={{ color: darkMode ? 'white' : 'black' }}
          >
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          </Button>

          {currentAccount ? (
            <Nav className="align-items-center">
              {renderUserStatus()}
              <Navbar.Text className="me-3">
                {userInfo?.name || formatAddress(currentAccount)}
              </Navbar.Text>
              <Button
                variant={darkMode ? "outline-danger" : "outline-dark"}
                size="sm"
                onClick={disconnectWallet}
              >
                Disconnect
              </Button>
            </Nav>
          ) : (
            <Button
              variant={darkMode ? "outline-light" : "outline-dark"}
              onClick={connectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;