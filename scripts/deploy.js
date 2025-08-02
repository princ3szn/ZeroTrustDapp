const hre = require("hardhat");

async function main() {
  const ZeroTrustContent = await hre.ethers.deployContract("ZeroTrustContent");
  await ZeroTrustContent.waitForDeployment();
  console.log("Contract deployed to:", await ZeroTrustContent.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
