import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0xcED0893883cbaFed12d5B4136091DbE988e83b0e";

const CONTRACT_ABI = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "ipfsHash",
                "type": "string"
            }
        ],
        "name": "ContentPosted",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_ipfsHash",
                "type": "string"
            }
        ],
        "name": "postContent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "registerUser",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "duration",
                "type": "uint256"
            }
        ],
        "name": "UserBanned",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            }
        ],
        "name": "UserRegistered",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            }
        ],
        "name": "UserSuspended",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            }
        ],
        "name": "UserVerified",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "verifyUser",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_offenseCount",
                "type": "uint256"
            }
        ],
        "name": "getBanDuration",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_user",
                "type": "address"
            }
        ],
        "name": "isUserVerified",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "maxOffenses",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "minBalance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "postCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "userPosts",
        "outputs": [
            {
                "internalType": "address",
                "name": "author",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "ipfsHash",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "users",
        "outputs": [
            {
                "internalType": "bool",
                "name": "isVerified",
                "type": "bool"
            },
            {
                "internalType": "uint256",
                "name": "lastVerified",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "offenses",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "banExpiry",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "verificationDuration",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Check if MetaMask is installed
export const isMetaMaskInstalled = () => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
};

// Get MetaMask provider specifically
const getMetaMaskProvider = () => {
  if (typeof window === 'undefined') return null;
  
  // If there's only one provider and it's MetaMask
  if (window.ethereum?.isMetaMask && !window.ethereum.providers) {
    return window.ethereum;
  }
  
  // If there are multiple providers, find MetaMask
  if (window.ethereum?.providers) {
    return window.ethereum.providers.find(provider => provider.isMetaMask);
  }
  
  return null;
};

// Get current account without requesting connection
export const getCurrentAccount = async () => {
  const metamask = getMetaMaskProvider();
  if (!metamask) {
    return null;
  }

  try {
    const accounts = await metamask.request({ 
      method: 'eth_accounts' 
    });
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error("Error getting current account:", error);
    return null;
  }
};

// Connect wallet (request account access)
export const connectWallet = async () => {
  const metamask = getMetaMaskProvider();
  if (!metamask) {
    throw new Error("MetaMask is not installed. Please install MetaMask!");
  }

  try {
    const accounts = await metamask.request({ 
      method: 'eth_requestAccounts' 
    });
    
    if (accounts.length === 0) {
      throw new Error("No accounts found. Please connect to MetaMask.");
    }
    
    return accounts[0];
  } catch (error) {
    console.error("Error connecting wallet:", error);
    throw error;
  }
};

export const getEthereumContract = async () => {
  const metamask = getMetaMaskProvider();
  if (!metamask) {
    console.error("MetaMask provider not found");
    throw new Error("Please install MetaMask!");
  }

  try {
    // Create provider using MetaMask specifically
    const provider = new ethers.BrowserProvider(metamask);
    
    // Get signer
    const signer = await provider.getSigner();
    
    // Create and return contract instance
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  } catch (error) {
    console.error("Contract initialization error:", error);
    throw error;
  }
};

export const checkNetworkAndConnect = async () => {
  const metamask = getMetaMaskProvider();
  if (!metamask) {
    throw new Error("MetaMask not found. Please install MetaMask.");
  }

  try {
    // Check network
    const chainId = await metamask.request({ method: 'eth_chainId' });
    
    // Sepolia testnet chain ID
    const sepoliaChainId = '0xaa36a7';
    
    if (chainId !== sepoliaChainId) {
      try {
        // Try to switch to Sepolia
        await metamask.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: sepoliaChainId }],
        });
      } catch (switchError) {
        // If switching fails, try to add the network
        if (switchError.code === 4902) {
          await metamask.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: sepoliaChainId,
              chainName: 'Sepolia Test Network',
              nativeCurrency: {
                name: 'SepoliaETH',
                symbol: 'SEP',
                decimals: 18
              },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io/']
            }]
          });
        } else {
          throw switchError;
        }
      }
    }
  } catch (error) {
    console.error("Network connection error:", error);
    throw error;
  }
};

export const getUserDetails = async (account) => {
  try {
    // Validate account
    if (!account) {
      throw new Error("No account provided");
    }

    // Get contract instance with comprehensive error handling
    const contract = await getEthereumContract();
    
    // Validate contract
    if (!contract) {
      throw new Error("Failed to initialize contract");
    }

    // Log for debugging
    console.log("Contract address:", contract.target);
    console.log("Fetching details for account:", account);

    // Fetch user details
    const userDetails = await contract.users(account);
    
    // Log raw user details for debugging
    console.log("Raw user details:", userDetails);

    // Return processed user details
    return {
      isVerified: userDetails[0],
      lastVerified: userDetails[1].toString(),
      offenses: userDetails[2].toString(),
      banExpiry: userDetails[3].toString(),
      isBanned: BigInt(userDetails[3]) > BigInt(Math.floor(Date.now() / 1000))
    };
  } catch (error) {
    console.error("Detailed error fetching user details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
};

export const registerNewUser = async () => {
  try {
    const contract = await getEthereumContract();
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    const tx = await contract.registerUser();
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

export const verifyUser = async () => {
  try {
    const contract = await getEthereumContract();
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    const tx = await contract.verifyUser();
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error("Error verifying user:", error);
    throw error;
  }
};

// Post content to the contract
export const postContent = async (ipfsHash) => {
  try {
    const contract = await getEthereumContract();
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    const tx = await contract.postContent(ipfsHash);
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error("Error posting content:", error);
    throw error;
  }
};

// Event listeners for MetaMask
export const onAccountsChanged = (callback) => {
  const metamask = getMetaMaskProvider();
  if (metamask) {
    metamask.on('accountsChanged', callback);
  }
};

export const onChainChanged = (callback) => {
  const metamask = getMetaMaskProvider();
  if (metamask) {
    metamask.on('chainChanged', callback);
  }
};

export const removeAllListeners = () => {
  const metamask = getMetaMaskProvider();
  if (metamask) {
    metamask.removeAllListeners('accountsChanged');
    metamask.removeAllListeners('chainChanged');
  }
};