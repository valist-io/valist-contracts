import * as mumbai from '../snapshots/mumbai.json';
import * as polygon from '../snapshots/polygon.json';

export function getRegistryAddress(chainId: number): string {
  switch(chainId) {
    case 137: // Polygon mainnet
      return '0xD504d012D78B81fA27288628f3fC89B0e2f56e24';
    case 80001: // Mumbai testnet
      return '0xD504d012D78B81fA27288628f3fC89B0e2f56e24';
    default: // test network or other
      return '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab';
  }
}

export function getRelayHubAddress(chainId: number): string {
  switch(chainId) {
    case 137: // polygon mainnet
      return '0x6C28AfC105e65782D9Ea6F2cA68df84C9e7d750d';
    case 80001: // polygon mumbai
      return '0x6646cD15d33cE3a6933e36de38990121e8ba2806';
    default: // testnet or unknown
      return '0x0000000000000000000000000000000000000000';
  }
}

export function getForwarderAddress(chainId: number): string {
  switch(chainId) {
    case 137: // polygon mainnet
      return '0xf0511f123164602042ab2bCF02111fA5D3Fe97CD';
    case 80001: // polygon mumbai
      return '0x9399BB24DBB5C4b782C70c2969F58716Ebbd6a3b';
    default: // testnet or unknown
      return '0x0000000000000000000000000000000000000000';
  }
}

export function getSnapshot(chainId: number) {
  switch (chainId) {
    case 137: // Polygon mainnet
      return polygon;
    default: // test network or other
      return mumbai;
  }
}
